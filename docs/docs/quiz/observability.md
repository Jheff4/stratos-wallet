---
sidebar_label: "Observability"
---

# Quiz — Observability

Covers structured logging and trace-ID correlation. Reference: [Architecture → Observability](../architecture#observability).

---

## Question 1 — Structured logging vs `console.log`

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Every subsystem uses <code>createLogger({ feature })</code> instead of raw <code>console.log</code>. What does the structure buy you?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Raw `console.log` produces strings a human can read and a machine can't. Structured logs carry **fields** — `level`, `feature`, `traceId`, and a typed payload — so they can be filtered, searched, and aggregated. "Show me every `warn` from `feature:websocket` in the last hour" is a query against structured logs and impossible against free-text.

It also standardises output: consistent shape, consistent metadata on every line, one place to change how logging behaves (and, later, one place to ship logs to an aggregation platform). Free-text logging scatters that decision across hundreds of call sites.

</div>
</details>

---

## Question 2 — Trace-ID propagation

<span class="diff diff--staff">Staff</span>

<div class="interview-q">A single user action fans out across UI, a GraphQL request, a WebSocket event, and a cache update. What does attaching one <code>traceId</code> to all of them give you that per-line logs don't?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

**Correlation.** A `traceId` lets you reconstruct the entire lifecycle of one action from a sea of interleaved logs — button click → GraphQL request → server work → WebSocket confirmation → cache update — all stitched by a single id. Without it you have thousands of true-but-disconnected lines and no way to know which belong to *this* user's transfer.

The staff-level framing: observability isn't "we log errors," it's "I can trace one user intent end to end with a single key." That's the difference between *having* logs and being able to *answer questions* with them — and it's what makes a production incident a five-minute query instead of an afternoon of guessing.

</div>
</details>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/system-design">System Design Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/real-time-communication">Real-Time Communication Strategy</a></li>
</ul>
</div>
