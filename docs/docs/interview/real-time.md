---
sidebar_label: "Real-Time Systems"
---

# Real-Time Systems Questions

Real-time questions are where frontend interviews get deep. Most candidates know how to open a WebSocket. Few have thought carefully about what happens when it breaks.

---

## WebSocket vs SSE vs polling — when do you use each?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Compare WebSocket, Server-Sent Events, and long polling. When is each the right choice?</div>

<div class="interview-a">

**Long polling** — The client makes an HTTP request and the server holds it open until new data is available (or a timeout). Then the client immediately makes another request.

Best for: legacy environments where WebSocket is blocked by proxies, or when you need a simple push mechanism with no infrastructure changes.
Avoid when: you need low latency or high message frequency. Each response-request cycle adds overhead.

**Server-Sent Events (SSE)** — A persistent HTTP connection over which the server pushes text events. The browser handles reconnection natively. HTTP/2 allows multiplexing multiple SSE streams.

Best for: unidirectional server-to-client push: notifications, live feeds, price updates, status streams. Simple to implement, works through most proxies.
Avoid when: you need bidirectional communication. SSE is one-way only — client messages need a separate HTTP request.

**WebSocket** — A persistent, full-duplex TCP connection. Both sides can send at any time after the handshake.

Best for: bidirectional communication (chat, collaborative editing, trading platforms), high-frequency updates where HTTP overhead matters, scenarios where you need the client to send data back on the same connection (subscriptions, ACKs, trade orders).
Avoid when: you only need server-to-client push and SSE would work — WebSocket adds complexity (custom reconnect logic, proxy issues, stateful server connections) that SSE handles automatically.

**In Stratos Wallet:** WebSocket was chosen for bidirectional capability needed by future trading features, and because it allows the client to send `{ type: 'subscribe', lastSeq: N }` for replay — which requires client-to-server messaging.

</div>

---

## How do sequence numbers enable reliable real-time systems?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Explain how sequence numbers work in a real-time event stream and what problems they solve that you can't solve without them.</div>

<div class="interview-a">

A sequence number is a monotonically increasing integer assigned to every event the server emits. The client tracks the last sequence it received.

**Problem 1 — Gap detection.**

Without sequence numbers, if the client misses events during a disconnect, it has no way to know. The feed looks continuous. The balance might be wrong by exactly the amount of the missed transactions — and nobody knows.

With sequence numbers: the client receives event seq=1921, then after a reconnect receives seq=1925. It knows events 1922, 1923, 1924 are missing. It can request a replay. Or at minimum it can log "sequence gap detected" and trigger a full refetch.

**Problem 2 — Replay protocol.**

Without sequence numbers, a reconnecting client has no anchor. The server can't know where to start replaying.

With sequence numbers: the client sends `{ type: 'subscribe', lastSeq: 1921 }`. The server checks its event buffer for events with `seq > 1921` and replays them in order. The client processes them with the same handlers as live events — because they are structurally identical.

**Problem 3 — Ordering verification.**

In distributed systems, events can be delivered out of order. Without sequence numbers, a client processing event B then event A might show state B→A when the correct state is A→B.

With sequence numbers: the client can detect that seq=43 arrived before seq=42 and delay processing seq=43 until seq=42 arrives, or flag the inversion for logging.

**What sequences don't solve:**

Deduplication. Two deliveries of the same event have the same `seq`. The client that has already processed seq=42 receives it again — the sequence number doesn't tell it "you've seen this before." That's what `eventId` is for. Seq and eventId solve different problems and you need both.

</div>

<div class="tip">The interviewer will often follow up: "what if the server restarts and the sequence counter resets?" The production answer: the sequence should be stored durably (database, not in-memory), or use a globally unique cursor like a timestamp-based ID (Snowflake IDs, ULIDs) that doesn't reset. Stratos Wallet's in-memory counter resets on server restart — an acknowledged limitation appropriate for a development environment.</div>

---

## How does exponential backoff prevent reconnect storms?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Your WebSocket server restarts and 50,000 clients reconnect. What happens without backoff, and what does backoff fix?</div>

<div class="interview-a">

**Without backoff:**

Every client retries at a fixed 1-second interval. The server goes down at T=0. At T=1, all 50,000 clients reconnect simultaneously. The server, just restarted with a cold cache and no warmed connection pool, receives 50,000 connection requests in one second. It hits resource limits and crashes or drops most connections. Those clients retry at T=2. Same thing. The server never stabilises.

This is the thundering herd problem. The solution isn't a bigger server — it's distributing the reconnect load over time.

**With exponential backoff + jitter:**

Each failed attempt waits longer than the last: 1s, 2s, 4s, 8s... capped at 30s. The jitter (random 0–1s added to each delay) ensures clients that disconnected at the same moment don't retry at the same moment.

After a server restart, reconnections spread over minutes rather than arriving all at once. The server handles a steady stream of a few hundred per second instead of 50,000 in one second.

```ts
const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30_000);
```

**The cap at 30 seconds is important.**

Without a cap, a client that has tried 15 times would wait over 9 hours. The user has left. The cap means: after enough failures, stabilise at a reasonable retry interval. Keep trying, but don't grow forever.

**Why jitter alone isn't enough:**

Without the exponential part, 50,000 clients each retrying every second with random 0–1s jitter still produces ~50,000 connections per second, just spread across each second. The exponential part reduces the *rate* of retries over time. Jitter distributes *simultaneous* retries. You need both.

</div>

---

## How do you deduplicate events in a real-time feed?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">At-least-once delivery means your WebSocket feed might receive the same event twice. How do you ensure it doesn't show duplicate transactions?</div>

<div class="interview-a">

Every event the server emits carries a unique `eventId` — a UUID generated at emission time, stable across any replay of the same event.

On the client, I maintain a bounded `Set<string>` of recently seen event IDs:

```ts
const seenEventIds = useRef(new Set<string>());

function processMessage(data: WSMessage) {
  if (data.eventId && seenEventIds.current.has(data.eventId)) {
    logger.warn('Duplicate event discarded', { eventId: data.eventId });
    return;  // drop before it reaches any handler
  }
  if (data.eventId) {
    seenEventIds.current.add(data.eventId);
    // Evict oldest if window is full
    if (seenEventIds.current.size > 200) {
      const oldest = seenEventIds.current.values().next().value;
      seenEventIds.current.delete(oldest);
    }
  }
  // process event
}
```

**Why bounded?**

Storing every `eventId` forever would eventually exhaust memory. Duplicates from network retransmission arrive within milliseconds to seconds of the original — not hours later. A 200-event window is enough to catch any practical duplicate delivery scenario.

**In production, use a TTL-based window instead:**

A count-based window might evict recent IDs on a high-frequency feed. A time-based window ("forget IDs older than 60 seconds") evicts by age, which is actually what matters for deduplication.

**Why not deduplicate by sequence number?**

Sequence numbers detect *gaps*, not duplicates. Two deliveries of event seq=42 both carry seq=42. The sequence tells you "I've seen 42 before" — but 42 in a sequence could be a gap you're filling via replay. The eventId is the fingerprint that unambiguously identifies a specific event emission, regardless of when it arrives.

</div>

<div class="stratos-related">
<h4>Related in this project</h4>
<ul>
<li><a href="../adrs/005-real-time-communication">ADR 005 — Real-Time Communication Strategy</a></li>
<li><a href="../adrs/007-websocket-reliability-protocol">ADR 007 — WebSocket Reliability Protocol</a></li>
<li><a href="../stories/azeez-in-the-tunnel">Story: Azeez in the Tunnel</a></li>
<li><a href="../stories/jons-duplicate-feed">Story: Jon's Duplicate Feed</a></li>
<li><a href="../stories/the-reconnect-storm">Story: The Reconnect Storm</a></li>
</ul>
</div>
