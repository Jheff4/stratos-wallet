---
sidebar_label: "Real-Time Systems"
---

# Quiz — Real-Time Systems

Covers transport choice, sequence numbers, deduplication, missed-event replay, and reconnection. Reference: [ADR: Real-Time Communication](../adrs/real-time-communication) · [ADR: WebSocket Reliability Protocol](../adrs/websocket-reliability-protocol).

---

## Question 1 — Transport choice

<span class="diff diff--senior">Senior</span>

<div class="interview-q">WebSocket vs Server-Sent Events vs polling — how do you choose, and why WebSocket here?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

- **Polling**: simplest, but trades latency for load — you're either too slow or hammering the server with mostly-empty requests. Fine for low-frequency, non-urgent data.
- **SSE**: server→client streaming over HTTP, auto-reconnect built in. Great when only the server pushes. But it's one-directional.
- **WebSocket**: full-duplex. Chosen here because the client also needs to send — `subscribe` with `lastSeq`, pings — and future trading features need low-latency bidirectional messaging. The cost is that reliability (reconnect, replay, dedup) is now *your* job, which is why the reliability protocol exists.

The honest framing: WebSocket isn't "better," it's the right tool when you need bidirectional and you're willing to own the reliability layer.

</div>
</details>

---

## Question 2 — Sequence numbers

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Every event carries a monotonically increasing <code>seq</code>. What does the client do with it, and what failure does it catch?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

The client tracks `lastSeq`. When an event arrives with `seq > lastSeq + 1`, it knows it **missed** events in between (`received − expected` of them) and logs/handles a gap. Without seq numbers, a dropped frame is invisible — the buyer just silently never sees an update, and the UI is wrong with no signal.

The recovery half: on reconnect the client sends `{ type: 'subscribe', lastSeq: N }`, and the server replays everything with `seq > N`. So seq numbers turn "we might have missed something, who knows" into "we missed exactly 43 and 44, please resend" — detectable and recoverable.

</div>
</details>

---

## Question 3 — Deduplication

<span class="diff diff--senior">Senior</span>

<div class="interview-q">The client keeps a bounded set of seen <code>eventId</code>s and drops repeats. What delivery guarantee makes this necessary?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

**At-least-once delivery.** Most messaging systems guarantee they'll deliver your message, but possibly more than once (e.g. a server resends because it didn't see your ack). That means the receiver must be **idempotent** — processing the same event twice must not double-apply it.

Dedup by `eventId` does that: seen it → drop it; new → record and process. The set is bounded (an LRU-lite window) so memory stays flat. Without it, a duplicated "balance updated" event could double a displayed change, or a duplicated transaction could appear twice in the feed.

</div>
</details>

---

## Question 4 — The reconnect storm

<span class="diff diff--staff">Staff</span>

<div class="interview-q">A server restarts and 50,000 clients drop at once. Why is naive immediate reconnect dangerous, and how do exponential backoff <em>and jitter</em> each help?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

If every client reconnects immediately, the server is hit by 50,000 simultaneous connections the instant it comes back — the **thundering herd** — and falls over again, producing an outage loop.

- **Exponential backoff** (1s, 2s, 4s, 8s… capped at 30s) reduces the *rate* of retries per client, giving the server room to recover.
- **Jitter** (a random 0–1s added to each delay) breaks *synchronisation*. Without it, all clients that dropped at the same instant retry at the same instants — backoff just moves the herd, it doesn't disperse it. Jitter smears reconnections across time so they arrive as a spread, not a spike.

You need both: backoff controls volume, jitter controls correlation.

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/azeez-in-the-tunnel">Azeez in the Tunnel — sequence numbers & replay</a></li>
<li><a href="../stories/jons-duplicate-feed">Jon's Duplicate Feed — deduplication</a></li>
<li><a href="../stories/the-reconnect-storm">The Reconnect Storm — exponential backoff</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/real-time">Real-Time Systems Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/real-time-communication">Real-Time Communication Strategy</a></li>
<li><a href="../adrs/websocket-reliability-protocol">WebSocket Reliability Protocol</a></li>
</ul>
</div>
