---
sidebar_label: "Resilience Engineering"
---

# Quiz: Resilience Engineering

Covers error boundaries, idempotency, and chaos simulation. Reference: [ADR: Failure Simulation](../adrs/failure-simulation) · [ADR: Idempotency & Optimistic Updates](../adrs/idempotency-and-optimistic-updates).

---

## Question 1: What error boundaries do and don't catch

<span class="diff diff--senior">Senior</span>

<div class="interview-q">What does a React error boundary actually catch, what does it <em>not</em> catch, and how do you handle the gaps?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

An error boundary catches errors thrown **during render, in lifecycle methods, and in the constructors of the tree below it**. It renders a fallback instead of letting a render crash blank the whole app.

It does **not** catch: errors in event handlers, async code (promises, `setTimeout`), server-side rendering, or errors thrown in the boundary itself. Those need their own handling: try/catch in handlers, React Query's error state for async data, and a fallback that itself can't throw (which is why our fallback narrows `unknown` instead of assuming `error.message`).

The point: an error boundary is the last line of defence for render crashes, not a catch-all. You pair it with per-layer handling for the cases it can't see.

</div>
</details>

---

## Question 2: Idempotency keys

<span class="diff diff--staff">Staff</span>

<div class="interview-q">A user taps "Transfer", the network stalls, they tap again. Without protection, what happens, and how does an idempotency key prevent it end to end?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Without protection, the two taps are two independent requests. Both can succeed, and the user sends money twice: the classic double-charge. Retries (yours or the browser's) make it worse: any resend is a potential duplicate.

An idempotency key is a unique token generated **once per user intent** (not per request) and attached to the mutation. The server records it: the first request with that key executes and stores the result; any later request with the same key returns the stored result instead of executing again. So a double-tap, a retry, or a reconnect-resend all collapse to a single transfer. The key is what makes "at-least-once delivery" safe for operations that move money: the network can deliver twice, but the money moves once.

</div>
</details>

---

## Question 3: Why a chaos layer

<span class="diff diff--senior">Senior</span>

<div class="interview-q">The app routes every mocked response through <code>applyChaos()</code> (latency, errors, drops, reordering, forced disconnects). Why build that instead of just testing the happy path?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Because the happy path is the one case that *doesn't* teach you anything about resilience. Real networks are slow, flaky, and reorder things; backends return partial responses and 503s. If you only ever develop against instant, perfect responses, you discover your missing loading states, race conditions, and broken retries in production, when a real incident is the teacher.

A chaos layer makes failure a **first-class, on-demand dev condition**. You build every feature while latency, drops, and duplicates are actively happening, so the empty/loading/error/duplicate states are designed in from the start, not bolted on after a post-mortem. It turns "we hope it's resilient" into "we watched it survive `catastrophicFailure` on a Tuesday."

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/sams-double-transfer">Sam's Double Transfer: idempotency</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/system-design">System Design Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/failure-simulation">Failure Simulation & Resilience System</a></li>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
</ul>
</div>
