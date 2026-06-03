---
sidebar_label: "Jon's Duplicate Feed"
---

# Jon's Duplicate Feed

*Concept: Event deduplication*

---

Jon works on the frontend team at a payments company. His latest feature is a live transaction feed — a WebSocket-powered list that updates in real time as new transactions come in.

It works beautifully in testing. He ships it on a Wednesday.

On Thursday, a user named Temi files a support ticket: "My transaction feed is showing every transaction twice. I received ₦50,000 but it shows two separate entries for the same deposit."

Jon looks at his logs. The WebSocket server sent one event. The client received it twice.

He digs in. The company's WebSocket infrastructure uses "at-least-once delivery" — a deliberate guarantee that says: *we will deliver every message. We might deliver it more than once. The receiver's job is to handle duplicates.*

Jon had never thought about this. He had assumed WebSocket meant "exactly once." It doesn't. Exactly-once delivery is extremely hard to guarantee across a distributed system. Most real-time platforms don't even try. They guarantee at-least-once instead, and leave deduplication to the consumer.

His feed had no deduplication. It rendered every event it received, no questions asked. On a slightly flaky network, the infrastructure sends some events twice. His feed shows them twice.

Temi's account balance is fine — the duplicate is only in the display, not in the ledger. But she's looking at a feed that says she received ₦50,000 twice and she doesn't know that. She files a support ticket. Two other users file support tickets the same day.

---

Jon's fix is simple once he understands the problem.

Every event from the server carries a unique ID — an `eventId`. Before rendering an event, check whether its `eventId` has been seen before. If yes, throw it away. If no, render it and remember it.

```ts
const seenEventIds = new Set<string>();

function handleMessage(event: WSMessage) {
  if (event.eventId && seenEventIds.has(event.eventId)) {
    return; // already processed — discard silently
  }

  if (event.eventId) {
    seenEventIds.add(event.eventId);
  }

  renderTransaction(event.transaction);
}
```

He deploys the fix. The duplicate feed stops. Temi's next transaction shows once.

---

## Why "at-least-once" is a deliberate choice, not a bug

Jon had assumed the infrastructure was broken. It wasn't.

Delivering each message exactly once requires the sender and receiver to coordinate — to acknowledge every delivery, and to hold the message until the acknowledgement is confirmed. This adds latency and complexity. At scale, it becomes a significant bottleneck.

Delivering each message at least once is much simpler: send it, maybe send it again if you're not sure it arrived, let the receiver sort it out. This is faster, simpler, and more robust to network interruptions.

The tradeoff shifts the complexity to the receiver. The receiver is responsible for being *idempotent* — capable of handling the same input twice without producing the wrong output twice.

At-least-once with idempotent receivers is the model used by Kafka, AWS SQS, most WebSocket platforms, and most message queues in production. It is the correct default assumption for any real-time system.

Jon's mistake was not knowing this. His code was written for a world where messages only arrive once. It's a common mistake and an expensive one to discover in production.

---

## The WhatsApp message that arrived three times

You've probably experienced this yourself. You send a WhatsApp message while on a bad connection. The blue ticks don't appear. You tap send again. Somehow, your friend receives the message three times.

From the infrastructure's perspective: the message was delivered. Multiple times. Because the network acknowledgement failed, the system retried. Your friend's app is supposed to deduplicate by message ID and show only one. Sometimes it does. Sometimes the app was closed between deliveries and the deduplication state was lost.

That's at-least-once delivery in everyday life. The sender retried because it wasn't sure. The receiver is supposed to handle it.

When your financial app shows a ₦150,000 transfer twice, the user does not think "oh, the app just got a duplicate WebSocket event." They think their money is gone. Two identical entries in a transaction feed looks exactly like two identical transactions.

Deduplication is not an optimisation. In a financial UI, it is a correctness requirement.

---

## The bounded window

Storing every `eventId` forever would eventually exhaust memory. In practice, you only need to remember recent IDs — duplicates from network retransmission arrive within seconds of the original, not hours later.

Stratos Wallet keeps the last 200 event IDs. When the window is full, the oldest ID is evicted. For a transaction feed that receives events every few seconds, 200 events covers several minutes of history — more than enough to absorb any duplicate delivery scenario a flaky network could produce.

In production with high-frequency feeds, the window should be time-based rather than count-based: "forget IDs older than 60 seconds." A count-based window may evict recent IDs on a busy feed. A TTL-based window evicts by age, which is what actually matters.

---

## What this is really about

The network will deliver the same message twice sometimes. This is not a bug in the infrastructure — it is the infrastructure choosing reliability over exactness.

Your job as the consumer is to be idempotent. Receiving the same event twice should produce the same outcome as receiving it once. That means checking whether you've seen the event before you act on it, and throwing it away if you have.

The eventId is the key to this. A random UUID assigned at emission time, the same on every delivery — it is the fingerprint that lets the receiver say "I've seen this before." Without it, two identical events look identical. With it, the first delivery and the duplicate are distinguishable.

**The engineering principle:** Design every real-time consumer to be idempotent. Assume at-least-once delivery. Track seen event IDs. Discard duplicates before they reach your application logic. Log when you do, so you can see how often the infrastructure actually delivers duplicates.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/007-websocket-reliability-protocol">ADR 007 — WebSocket Reliability Protocol</a></li>
<li><a href="../interview/real-time">Interview: How do you deduplicate events in a real-time feed?</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./azeez-in-the-tunnel">Azeez in the Tunnel — sequence numbers, the companion problem</a></li>
<li><a href="./the-reconnect-storm">The Reconnect Storm — exponential backoff</a></li>
</ul>
</div>
