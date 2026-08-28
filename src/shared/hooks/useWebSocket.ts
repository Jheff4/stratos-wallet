import { useEffect, useRef, useCallback, useState } from 'react';
import { useChaos } from '@chaos/ChaosContext';
import { createLogger } from '@shared/logger';

// ============================================================
// useWebSocket: Reliable WebSocket Hook
// ============================================================
//
// WHAT THIS HOOK PROVIDES ON TOP OF RAW WebSocket:
//
//   1. Exponential backoff reconnection
//      Prevents reconnect storms after an outage.
//        If 10,000 clients all reconnect at once, the server
//        dies. Randomised backoff spreads the load.
//
//   2. Event deduplication (by eventId)
//      At-least-once delivery is a guarantee many systems
//        make. "We will deliver your message, possibly more
//        than once." The receiver must be idempotent.
//        We track the last DEDUP_WINDOW_SIZE eventIds and
//        drop any we've already processed.
//
//   3. Sequence number tracking (seq)
//      Lets us detect gaps: if we receive seq=45 and our
//        lastSeq=42, we know we missed #43 and #44.
//        On reconnect, we send { type: 'subscribe', lastSeq }
//        so the server can replay what we missed.
//
//   4. Connection status
//      Exposes 'connected' | 'reconnecting' | 'disconnected'
//        so UI can show appropriate feedback without digging
//        into WebSocket internals.
//
//   5. Chaos simulation
//      Integrates with ChaosContext to simulate latency,
//        message drops, duplicates, reordering, and forced
//        disconnects. Every chaos path is logged so you can
//        see exactly what the simulation is doing.
//
// ============================================================
//
// DEDUPLICATION WINDOW SIZE
//
// We keep the last N eventIds in a Set. When an event arrives:
//   If its eventId is in the Set: drop it (duplicate).
//   If not: add it to the Set, process the event.
//
// When the Set exceeds DEDUP_WINDOW_SIZE, we remove the oldest
// entry. This is a LRU-lite eviction, not perfect (we use a
// Set, not a proper LRU cache) but correct for our load.
//
// In production: use a proper LRU cache or a time-based TTL
// (e.g., "forget eventIds older than 60 seconds").
//
// ============================================================

const logger = createLogger({ feature: 'websocket' });

const DEDUP_WINDOW_SIZE = 200;   // how many recent eventIds to remember
const MAX_RECONNECT_DELAY = 30_000; // ms cap on backoff

// --------------------------------------------------------
// Public types
// --------------------------------------------------------

export type WSConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';

export type WSMessage = {
  type: string;
  seq?: number;
  eventId?: string;
  replayed?: boolean;
  [key: string]: unknown;
};

type MessageHandler = (data: WSMessage) => void;

interface UseWebSocketReturn {
  send:   (data: unknown) => void;
  status: WSConnectionStatus;
  lastSeq: number;
}

// --------------------------------------------------------
// Hook
// --------------------------------------------------------

export function useWebSocket(
  url: string,
  onMessage: MessageHandler,
): UseWebSocketReturn {
  const { config } = useChaos();

  const wsRef                 = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef  = useRef(0);

  // Sequence tracking: persists across reconnects so we can
  // request replay of missed events on every reconnect.
  const lastSeqRef = useRef<number>(0);

  // Deduplication window: bounded Set of recently seen eventIds.
  // Using a Set for O(1) lookups; eviction is manual.
  const seenEventIds = useRef<Set<string>>(new Set());

  // Stable ref to the message handler: prevents reconnecting
  // every time the parent component re-renders with a new inline
  // function reference.
  const onMessageRef = useRef<MessageHandler>(onMessage);
  onMessageRef.current = onMessage;

  // React state for the connection status exposed to callers.
  const [status, setStatus] = useState<WSConnectionStatus>('connecting');
  const [lastSeq, setLastSeq] = useState(0);

  // --------------------------------------------------------
  // Deduplication helper
  // --------------------------------------------------------
  const isDuplicate = useCallback((eventId: string): boolean => {
    if (seenEventIds.current.has(eventId)) {
      return true;
    }

    seenEventIds.current.add(eventId);

    // Evict oldest entry once the window is full.
    // Set iteration order is insertion order, so .values().next()
    // gives us the oldest entry.
    if (seenEventIds.current.size > DEDUP_WINDOW_SIZE) {
      const oldest = seenEventIds.current.values().next().value;
      if (oldest !== undefined) seenEventIds.current.delete(oldest);
    }

    return false;
  }, []);

  // --------------------------------------------------------
  // connect()
  // --------------------------------------------------------
  const connect = useCallback(() => {
    // Clean up any existing connection before creating a new one.
    if (wsRef.current) {
      wsRef.current.onclose = null; // prevent recursive reconnect
      wsRef.current.close();
    }

    logger.info('Opening WebSocket connection', { url, attempt: reconnectAttemptsRef.current });
    setStatus(reconnectAttemptsRef.current === 0 ? 'connecting' : 'reconnecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    // ---- onopen ----
    ws.onopen = () => {
      logger.info('WebSocket connected', { seq: lastSeqRef.current });
      reconnectAttemptsRef.current = 0;
      setStatus('connected');

      // Subscribe and request replay of any events missed while
      // we were disconnected. lastSeq=0 on first connect means
      // "I have nothing yet," server sends replay_complete immediately.
      ws.send(JSON.stringify({
        type:    'subscribe',
        lastSeq: lastSeqRef.current,
      }));

      // Keepalive ping every 25 seconds.
      // Why 25s? Most load balancers kill idle connections at 30s.
      // Pinging before that keeps the TCP session alive.
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25_000);
    };

    // ---- onmessage ----
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WSMessage;

        // -- Chaos: message drop --
        // Simulates packet loss. In production, the OS/network layer
        // drops packets; at the application layer we simulate it here.
        if (config.messageDropRate > 0 && Math.random() < config.messageDropRate) {
          logger.warn('Chaos: message dropped', { type: data.type, seq: data.seq });
          return;
        }

        // -- Chaos: message reorder --
        // Delivers the message after a delay, simulating out-of-order
        // arrival. We return immediately so this message is "skipped"
        // and delivered late. The actual delivery happens in the timeout.
        if (config.messageReorderRate > 0 && Math.random() < config.messageReorderRate) {
          const delay = 500 + Math.random() * 1_500;
          logger.warn('Chaos: message reordered', { type: data.type, seq: data.seq, delayMs: delay });
          setTimeout(() => processMessage(data), delay);
          return;
        }

        // -- Chaos: duplicate event --
        // Simulates at-least-once delivery: the event arrives twice.
        // Our deduplication (by eventId) should silently discard the copy.
        if (config.duplicateWsEvents && Math.random() < 0.5) {
          const delay = 100 + Math.random() * 300;
          logger.warn('Chaos: scheduling duplicate event', { type: data.type, seq: data.seq, delayMs: delay });
          setTimeout(() => processMessage(data), delay);
          // Fall through: also deliver the original immediately below.
        }

        processMessage(data);
      } catch (e) {
        logger.error('Failed to parse WebSocket message', { error: e });
      }
    };

    // ---- onclose ----
    ws.onclose = (event) => {
      logger.warn('WebSocket disconnected', {
        code:   event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
      setStatus('disconnected');

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Exponential backoff reconnection.
      //
      // WHY EXPONENTIAL BACKOFF?
      // If a server restarts and 50,000 clients all reconnect
      // simultaneously (the "thundering herd"), the server is
      // immediately overwhelmed again. Exponential backoff with
      // jitter spreads reconnect attempts across time:
      //   attempt 0: ~1s
      //   attempt 1: ~2s
      //   attempt 2: ~4s
      //   ...capped at 30s
      //
      // The Math.random() jitter prevents clients that disconnected
      // at the same moment from all retrying at the same moment.
      const baseDelay     = 1_000 * Math.pow(2, reconnectAttemptsRef.current);
      const jitter        = Math.random() * 1_000;
      const reconnectDelay = Math.min(baseDelay + jitter, MAX_RECONNECT_DELAY);

      logger.info('Scheduling reconnect', {
        attempt: reconnectAttemptsRef.current,
        delayMs: Math.round(reconnectDelay),
      });

      reconnectAttemptsRef.current += 1;
      setStatus('reconnecting');

      reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
    };

    // ---- onerror ----
    ws.onerror = (error) => {
      logger.error('WebSocket error', { error });
      ws.close(); // triggers onclose, which handles reconnect
    };
  }, [url, config.messageDropRate, config.messageReorderRate, config.duplicateWsEvents, isDuplicate]);

  // --------------------------------------------------------
  // processMessage: deduplication + sequence tracking
  // --------------------------------------------------------
  function processMessage(data: WSMessage): void {
    // Deduplication: if we've seen this eventId, drop it.
    if (data.eventId) {
      if (isDuplicate(data.eventId)) {
        logger.warn('Duplicate event discarded', {
          eventId: data.eventId,
          type:    data.type,
          seq:     data.seq,
        });
        return;
      }
    }

    // Sequence tracking: detect and log gaps.
    if (typeof data.seq === 'number') {
      const expectedSeq = lastSeqRef.current + 1;

      if (data.seq > expectedSeq) {
        const missed = data.seq - expectedSeq;
        logger.warn('Sequence gap detected', {
          expected: expectedSeq,
          received: data.seq,
          missed,
        });
        // We still process this event. In a production system you might
        // also trigger a refetch or show a "data may be incomplete" banner.
      }

      if (data.seq > lastSeqRef.current) {
        lastSeqRef.current = data.seq;
        setLastSeq(data.seq);
      }
    }

    if (data.replayed) {
      logger.info('Replayed event processed', { type: data.type, seq: data.seq });
    }

    onMessageRef.current(data);
  }

  // --------------------------------------------------------
  // Initial connection
  // --------------------------------------------------------
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current)     clearInterval(pingIntervalRef.current);

      // Null out onclose before closing to prevent the close handler
      // from scheduling a reconnect during component unmount.
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // --------------------------------------------------------
  // Chaos: force disconnect
  // Closes the connection when the chaos config demands it.
  // The onclose handler will then schedule a reconnect.
  // --------------------------------------------------------
  useEffect(() => {
    if (config.forceDisconnect && wsRef.current?.readyState === WebSocket.OPEN) {
      logger.warn('Chaos: forced disconnect triggered');
      wsRef.current.close();
    }
  }, [config.forceDisconnect]);

  // --------------------------------------------------------
  // send: safely sends a message when the socket is open.
  // Callers do not need to check readyState themselves.
  // --------------------------------------------------------
  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      logger.warn('Attempted send while socket not open', { status });
    }
  }, [status]);

  return { send, status, lastSeq };
}
