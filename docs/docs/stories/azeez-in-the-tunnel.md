---
sidebar_label: "Azeez in the Tunnel"
---

# Azeez in the Tunnel

*Concept: WebSocket sequence numbers · Missed-event replay*

---

Azeez is a trader. He lives in Lagos and commutes to the Island every morning on the BRT. The bridge section goes through a dead zone: no signal for about ninety seconds.

He's watching a live crypto portfolio app on his phone. The app has a real-time WebSocket feed pushing price updates and transaction events as they happen.

He enters the tunnel at 8:47am. His WebSocket connection drops.

While he's underground, three things happen on his account:
- A limit order fills: +₦280,000 received
- A fee is charged: -₦2,800
- A second limit order fills: +₦415,000 received

He exits the tunnel at 8:49am. His app reconnects.

The WebSocket picks up from the current moment. New events start flowing in. But the three events that happened during the ninety seconds are just... gone. The feed has no memory of them. It doesn't know it missed anything.

Azeez looks at his balance. It shows ₦198,000. The real balance is ₦891,200.

He's staring at wrong numbers and doesn't know it.

---

Now rewind. Same commute, same tunnel, same dropped connection.

This time, every event the server sends carries a sequence number, a simple counter that increments with every event, never resets, never skips.

```
8:47:01am  { seq: 1841, type: 'order_filled',  amount: +280,000 }
8:47:14am  { seq: 1842, type: 'fee_charged',   amount: -2,800   }
8:47:58am  { seq: 1843, type: 'order_filled',  amount: +415,000 }
```

Azeez's app tracks the last sequence number it processed. Just before he enters the tunnel, it was `1840`.

The connection drops. The three events go out to other clients. His device never receives them.

He exits the tunnel. The app reconnects. The very first thing it does is send a message to the server:

```ts
ws.send({ type: 'subscribe', lastSeq: 1840 });
```

The server checks its event buffer. It has events 1841, 1842, and 1843. It replays them, in order, with a `replayed: true` flag so the app knows these are catch-up events.

```
REPLAY: { seq: 1841, type: 'order_filled', amount: +280,000, replayed: true }
REPLAY: { seq: 1842, type: 'fee_charged',  amount: -2,800,   replayed: true }
REPLAY: { seq: 1843, type: 'order_filled', amount: +415,000, replayed: true }
```

The app processes them. Balance becomes ₦891,200. Correct.

Azeez never knew the connection dropped.

---

## The gap detection problem

Sequence numbers do more than enable replay. They let the client know when something is wrong before it can even ask for a replay.

Imagine Azeez is on a long call and the app's WebSocket is running in the background. The app receives:

```
seq: 1920
seq: 1921
seq: 1925  ← jumped from 1921 to 1925
```

The client's last sequence was 1921. It receives 1925. It knows immediately: events 1922, 1923, and 1924 are missing. It doesn't have to wait for a reconnect. It can flag the gap in real time, log it, and decide whether to surface a "data may be incomplete, tap to sync" message.

Without sequence numbers, this gap is invisible. The client has no idea that 1922–1924 existed. It just continues as if nothing happened. The balance displayed might be wrong by three events, and nobody knows.

---

## The ticket stub at a concert

Here's a way to hold the concept.

You go to a concert. The venue hands out numbered ticket stubs as people enter: #001, #002, #003... You're #847. Your friend is coming later, she's #901.

You go in, enjoy the first two acts. At interval you call her: "Where are you?" She says "I'm just entering, I'm #913."

You know she missed the first 66 people who entered after you. You don't know who they were, but you know the gap exists. If the concert had assigned her stub #848 and she shows up with #913, you know 65 events happened that you weren't there for.

That's what sequence numbers do. They turn a formless stream of events into a numbered list where gaps are detectable.

---

## What happens when the gap is too large

The server keeps a buffer of recent events: Stratos Wallet keeps the last 200. If Azeez's tunnel lasts not 90 seconds but 90 minutes, and 400 events happened while he was underground, the buffer can only replay the most recent 200.

In that case the server sends a `replay_overflow` message: "I can't replay that far back. You've missed too much. Do a full refetch."

The client then calls the REST/GraphQL API to reload the current state from scratch. Not ideal, but correct. And the user never sees an inconsistent balance. They see a brief loading state and then accurate data.

This is the honest tradeoff: the buffer is finite, so very long disconnections require a full reload. But short disconnections (the ones that actually happen to real users) are completely transparent.

---

## What this is really about

A real-time feed without sequence numbers is a one-way firehose. Events come in when they come in. If you miss some, you miss them.

A real-time feed with sequence numbers is a conversation. The client and server both know where they are. Reconnecting after a gap becomes "here's where I left off" rather than "I have no idea what I missed."

For a financial application, a balance derived from a partial event stream is not a balance. It's a guess. Sequence numbers make the difference between "my balance is definitely correct" and "my balance is probably correct unless I disconnected."

**The engineering principle:** Every real-time event stream should carry a sequence number. The receiver should track its last known sequence. On reconnect, request replay from that sequence. Log gaps. Never display data you know might be incomplete without surfacing it to the user.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/websocket-reliability-protocol">WebSocket Reliability Protocol</a></li>
<li><a href="../adrs/real-time-communication">Real-Time Communication Strategy</a></li>
<li><a href="../interview/real-time">Interview: How do sequence numbers enable reliable real-time systems?</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./jons-duplicate-feed">Jon's Duplicate Feed: deduplication, the companion problem</a></li>
<li><a href="./the-reconnect-storm">The Reconnect Storm: what happens when everyone reconnects at once</a></li>
</ul>
</div>
