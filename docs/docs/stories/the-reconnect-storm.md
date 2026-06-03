---
sidebar_label: "The Reconnect Storm"
---

# The Reconnect Storm

*Concept: Exponential backoff with jitter*

---

It's 11:58pm on a Friday. Nate is on-call.

The company's WebSocket server needs a routine restart to pick up a configuration update. It takes about 45 seconds. Nate runs the script and watches the monitoring dashboard.

The server goes down. Good.

Then this happens.

At 11:58:03pm — the exact second the server comes back online — 12,000 WebSocket clients reconnect simultaneously. Every client had been retrying every second. Every client was waiting for the server. The moment the server restarted, all 12,000 hit it at the same time.

The server, having just restarted with minimal warm-up, receives 12,000 connection requests in one second. It runs out of connection pool capacity. It starts dropping connections. Clients that reconnected successfully are immediately disconnected again because the server can't handle the load. Those clients retry. The cycle repeats.

The server is now in a crash loop it cannot escape. Every time it stabilises slightly, the reconnect wave hits it again.

Nate spends 45 minutes trying to bring the system back to a stable state. At 12:43am, he gets it under control by temporarily blocking client connections and slowly letting them in in batches. He goes to bed at 2am. He writes the post-mortem the next morning.

The root cause is simple: every client was retrying on the same cadence. When they all disconnected at the same moment, they all reconnected at the same moment. The load was not spread out at all.

---

The fix is two lines of code.

After every disconnect, instead of retrying in exactly one second, the client waits for a delay that grows exponentially — and adds a random jitter.

```ts
const baseDelay  = 1000 * Math.pow(2, attempt);     // 1s, 2s, 4s, 8s, 16s...
const jitter     = Math.random() * 1000;             // 0–1000ms random
const delay      = Math.min(baseDelay + jitter, 30_000);
```

Now when the same server restart happens:

- Some clients wait 1.1 seconds
- Some clients wait 1.7 seconds
- Some clients wait 1.4 seconds
- After a few retries, some clients are waiting 4 seconds, some 6, some 8

The 12,000 reconnections that used to arrive at the same moment are now spread across 30 seconds. The server comes back online and handles ~400 connections per second instead of 12,000 per second. It stays stable. Nobody pages Nate.

---

## Why exponential, not just jitter?

Jitter alone solves the "all at once" problem but not the "retrying too frequently" problem.

If 12,000 clients each retry every second with random jitter, you still get roughly 12,000 reconnection attempts every second, just spread across time within each second. That's still 720 per minute — a constant, heavy load on a recovering server.

The exponential part means each failed attempt makes the client wait longer. After five failures, a client is waiting 32 seconds before the next attempt. After six, 64 seconds. This is the system's way of saying: "If you've been unable to connect multiple times in a row, back off and give the server room to recover."

Combined, they do two things:
1. **Jitter** spreads reconnections across time within each retry cycle — prevents simultaneous reconnect storms.
2. **Exponential growth** increases the interval between retries over time — reduces load on a struggling server.

---

## The formula Nate never forgets

```
attempt 0: 1s   base + 0–1s jitter  →  1.0–2.0s
attempt 1: 2s   base + 0–1s jitter  →  2.0–3.0s
attempt 2: 4s   base + 0–1s jitter  →  4.0–5.0s
attempt 3: 8s   base + 0–1s jitter  →  8.0–9.0s
attempt 4: 16s  base + 0–1s jitter  → 16.0–17.0s
attempt 5+: capped at 30s            → 30.0–31.0s
```

No two clients that disconnected at the same time will retry at exactly the same time. And the gap between retries grows — so a recovering server gets progressively more breathing room.

---

## The doctor's waiting room

Imagine a doctor's surgery with one doctor. The appointment system crashes at 9am. 200 patients who had 9am appointments can no longer book. At 9:15am, the system comes back online.

If all 200 patients try to book the moment the system returns, the booking server is instantly overwhelmed and crashes again.

If instead the system tells each patient to try again in a random amount of time between 9:15am and 10:00am, the load is distributed. The server processes 200 bookings smoothly over 45 minutes instead of 200 in one second.

That's exponential backoff with jitter. The random spread is the jitter. The increasing wait time with each failed attempt is the exponential part. Together they protect the server from its own users.

---

## Why the cap at 30 seconds

Without a cap, the wait time doubles forever. After 10 failed attempts, a client would wait 17 minutes. After 12, an hour. That's not useful — the user has left.

The cap says: "After enough failures, stabilise at 30 seconds. Keep trying, just not frantically." The client stays connected to the retry loop. When the server eventually recovers, the client reconnects within 30 seconds — without ever having given up entirely.

---

## What this is really about

The reconnect storm is one of those failure modes that only reveals itself at scale. With 10 users, it doesn't matter. With 10,000 users, it takes down your server after every restart. With 100,000 users, it means a planned maintenance window becomes a production incident every single time.

Exponential backoff with jitter is the standard solution, used by every major cloud SDK, every production WebSocket library, and every distributed system that has learned this lesson once. It takes about ten lines of code to implement and it is the difference between "routine maintenance restart" and "2am on-call incident."

**The engineering principle:** Never retry at a fixed interval. Every retry should wait longer than the last. Add random jitter so clients don't synchronise. Cap the backoff so clients don't give up entirely. These three rules make reconnection safe at any scale.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/007-websocket-reliability-protocol">ADR 007 — WebSocket Reliability Protocol</a></li>
<li><a href="../interview/real-time">Interview: How does exponential backoff prevent reconnect storms?</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./azeez-in-the-tunnel">Azeez in the Tunnel — what happens after reconnect</a></li>
<li><a href="./jons-duplicate-feed">Jon's Duplicate Feed — deduplication after reconnect</a></li>
</ul>
</div>
