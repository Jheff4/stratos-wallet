import { WebSocketServer, WebSocket } from 'ws';

// ============================================================
// Stratos Wallet: WebSocket Event Server
// ============================================================
//
// PROTOCOL DESIGN
//
// Every event the server emits carries two reliability fields:
//
//   seq     : a monotonically increasing integer, global across
//             all clients. Never resets while the server is running.
//             Purpose: lets clients detect gaps (missed events).
//
//   eventId : a UUID that is unique per event emission.
//             Purpose: lets clients deduplicate events that arrive
//             more than once due to network retransmission or
//             chaos simulation.
//
// WHY BOTH?
//   seq alone cannot deduplicate: the same seq is never reused, so
//   a duplicate delivery of event #42 arrives as seq=42 twice,
//   but the client cannot distinguish "I got 42 twice" from "I got
//   42 once." EventId solves this: it is unique per emission, so
//   seeing the same eventId twice means "drop it."
//
//   eventId alone cannot detect gaps: two different events have
//   different eventIds. If you miss event #42, you have no way to
//   know it existed. seq solves this: if you see #41 then #43, you
//   know #42 is missing.
//
// REAL-WORLD PARALLEL
//   Kafka offsets work like seq. Kafka message keys work like eventId.
//   Every major real-time system (Stripe, Coinbase, Slack) uses both.
//
// ============================================================
//
// REPLAY PROTOCOL
//
// When a client reconnects it sends:
//   { type: 'subscribe', lastSeq: N }
//
// The server looks in EVENT_BUFFER for events with seq > N and
// replays them. The buffer holds the last BUFFER_SIZE events.
// If the gap exceeds the buffer, the server sends:
//   { type: 'replay_overflow', fromSeq: N, currentSeq: M }
// and the client should do a full REST/GraphQL refetch instead.
//
// ============================================================

const PORT = 8080;
const BUFFER_SIZE = 200; // events to retain for replay
const HEARTBEAT_INTERVAL_MS = 30_000;
const TRANSACTION_INTERVAL_MS = 5_000;
const TRANSACTION_JITTER_MS   = 3_000;

const wss = new WebSocketServer({ port: PORT });
console.log(`[WS Server] Running on ws://localhost:${PORT}`);

// --------------------------------------------------------
// Global sequence counter.
// Increments with every event emitted to any client.
// Never resets: monotonic for the server lifetime.
// --------------------------------------------------------
let globalSeq = 0;

// --------------------------------------------------------
// Event buffer for replay.
// Bounded ring-buffer: once full, oldest events are evicted.
// --------------------------------------------------------
interface BufferedEvent {
  seq: number;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
}

const eventBuffer: BufferedEvent[] = [];

function bufferEvent(event: BufferedEvent): void {
  eventBuffer.push(event);
  if (eventBuffer.length > BUFFER_SIZE) {
    eventBuffer.shift(); // evict oldest
  }
}

// --------------------------------------------------------
// Emit a typed event to a specific client.
// Assigns seq and eventId, buffers, then sends.
// --------------------------------------------------------
function emit(
  ws: WebSocket,
  type: string,
  payload: Record<string, unknown>,
): void {
  const seq     = ++globalSeq;
  const eventId = crypto.randomUUID();

  const event: BufferedEvent = { seq, eventId, type, payload };
  bufferEvent(event);

  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, seq, eventId, ...payload }));
  }
}

// --------------------------------------------------------
// Broadcast to all connected clients (used for future
// multi-client scenarios, e.g. admin seeing live feed).
// --------------------------------------------------------
function broadcast(type: string, payload: Record<string, unknown>): void {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      emit(ws, type, payload);
    }
  });
}
void broadcast; // exported for future use

// --------------------------------------------------------
// Transaction generator: simulates a live transaction feed.
// In production this would be driven by actual ledger writes.
// --------------------------------------------------------
const TRANSACTION_TYPES  = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'] as const;
const TRANSACTION_LABELS = [
  'Salary',
  'ATM withdrawal',
  'Online purchase',
  'Interest payment',
  'Subscription charge',
  'Freelance income',
] as const;

function generateTransaction() {
  return {
    id:                   `t${Date.now()}`,
    amount:               Math.round(Math.random() * 1_000 * 100) / 100,
    currency:             'USD',
    type:                 TRANSACTION_TYPES[Math.floor(Math.random() * TRANSACTION_TYPES.length)],
    description:          TRANSACTION_LABELS[Math.floor(Math.random() * TRANSACTION_LABELS.length)],
    createdAt:            new Date().toISOString(),
    sourceAccountId:      `a${Math.floor(Math.random() * 2) + 1}`,
    destinationAccountId: `a${Math.floor(Math.random() * 2) + 1}`,
  };
}

// --------------------------------------------------------
// Connection handler
// --------------------------------------------------------
wss.on('connection', (ws) => {
  console.log(`[WS Server] Client connected  (total: ${wss.clients.size})`);

  // Welcome message includes the current sequence so the
  // client knows where the stream starts.
  ws.send(JSON.stringify({
    type:         'connected',
    message:      'Real-time feed active',
    currentSeq:   globalSeq,
  }));

  // ---- Incoming message handler ----
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        return;
      }

      // ---- Replay request ----
      // Client sends { type: 'subscribe', lastSeq: N } on reconnect.
      // We find all buffered events with seq > N and replay them in order.
      if (msg.type === 'subscribe' && typeof msg.lastSeq === 'number') {
        const lastSeq     = msg.lastSeq;
        const missed      = eventBuffer.filter((e) => e.seq > lastSeq);
        const bufferStart = eventBuffer.length > 0 ? eventBuffer[0].seq : globalSeq;

        if (lastSeq < bufferStart - 1 && missed.length === 0 && globalSeq > lastSeq) {
          // The gap is larger than the buffer: the client missed more
          // events than we can replay. Tell it to do a full refetch.
          ws.send(JSON.stringify({
            type:        'replay_overflow',
            fromSeq:     lastSeq,
            currentSeq:  globalSeq,
            message:     'Gap exceeds replay buffer. Perform a full data refetch.',
          }));
          console.warn(
            `[WS Server] Replay overflow: client at seq ${lastSeq}, server at seq ${globalSeq}`
          );
          return;
        }

        if (missed.length > 0) {
          console.log(`[WS Server] Replaying ${missed.length} events (seq ${lastSeq + 1}–${globalSeq})`);
          for (const event of missed) {
            ws.send(JSON.stringify({
              type:      event.type,
              seq:       event.seq,
              eventId:   event.eventId,
              replayed:  true, // flag so client can log "this was a replay"
              ...event.payload,
            }));
          }
        }

        ws.send(JSON.stringify({
          type:       'replay_complete',
          replayedCount: missed.length,
          currentSeq: globalSeq,
        }));
        return;
      }
    } catch (err) {
      console.error('[WS Server] Failed to parse message:', err);
    }
  });

  // ---- Live transaction feed ----
  const scheduleNext = () => {
    const delay = TRANSACTION_INTERVAL_MS + Math.random() * TRANSACTION_JITTER_MS;
    return setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        emit(ws, 'new_transaction', { transaction: generateTransaction() });
        transactionTimer = scheduleNext();
      }
    }, delay);
  };

  let transactionTimer = scheduleNext();

  ws.on('close', () => {
    console.log(`[WS Server] Client disconnected (total: ${wss.clients.size})`);
    clearTimeout(transactionTimer);
  });

  ws.on('error', (err) => {
    console.error('[WS Server] Client error:', err.message);
  });
});

// --------------------------------------------------------
// Server-wide heartbeat
// Keeps connections alive through load balancers and NAT
// gateways that close idle TCP connections.
// --------------------------------------------------------
const heartbeat = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  });
}, HEARTBEAT_INTERVAL_MS);

wss.on('close', () => {
  clearInterval(heartbeat);
});
