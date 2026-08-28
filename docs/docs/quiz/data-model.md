---
sidebar_label: "Ledger & Data Model"
---

# Quiz: Ledger & Data Model

Covers the ledger-first model, derived balances, event sourcing, and snapshots. Reference: [ADR: Ledger-First Data Model](../adrs/ledger-first-data-model).

---

## Question 1: Why not store the balance

<span class="diff diff--mid">Mid</span>

<div class="interview-q">A balance is just a number. Why does this app <em>compute</em> it from a ledger instead of storing it as a <code>balance</code> field on the account?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

A stored `balance` is a second source of truth that has to be kept in sync with the transaction history. The day a write half-fails, a race interleaves two updates, or a migration hiccups, the stored balance and the sum of transactions disagree, and now you have money that doesn't reconcile. For a fintech that means frozen withdrawals and regulatory questions.

Storing only the append-only ledger and deriving the balance (`sum(credits) − sum(debits)`) means there's exactly one source of truth. The balance can never disagree with history because it *is* history, summed. You trade a little compute for the guarantee that your numbers always reconcile.

</div>
</details>

---

## Question 2: Event sourcing on the frontend

<span class="diff diff--senior">Senior</span>

<div class="interview-q">How is "balances, charts, and analytics are all projections of one append-only ledger" an example of event sourcing, and why does it make new features cheap?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Event sourcing stores the *events* (the ledger entries) as the source of truth and derives every view by replaying them. Here, balance, balance-history, spending-by-category, and the portfolio breakdown are all separate **projections** of the same entries, each one a different reduction over the ledger.

That makes features additive: a new analytics view is a new query against the existing source of truth, not a new column you have to populate and keep in sync. You never migrate the core data to add a chart: you write a new projection. The hard part (correct, reconcilable data) is solved once.

</div>
</details>

---

## Question 3: Snapshots at scale

<span class="diff diff--staff">Staff</span>

<div class="interview-q">An interviewer pushes back: "Summing the whole ledger on every balance read is O(n), that's slow at scale." How do you keep the ledger and still answer fast?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Snapshots. A snapshot is a saved `computeBalance()` result at a point in time. Instead of scanning all `n` entries, you load the latest snapshot and scan only the `k` entries created after it: `computeBalanceFromSnapshot(snapshot, recentEntries)`.

A nightly snapshot bounds `k` to ~one day of activity: tens of entries, not thousands. Crucially, the snapshot is a **read optimisation, not a new source of truth**: if it's ever wrong, you throw it away and recompute from the full ledger. So you get O(k) reads without reintroducing the two-sources-of-truth problem that storing a mutable balance would. The ledger stays untouched; `computeBalance` is just called with a shorter slice.

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/nates-missing-thousands">Nate's Missing Thousands: why the ledger is the foundation</a></li>
<li><a href="../stories/sams-invisible-bug">Sam's Invisible Bug: O(n) reads & snapshots</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/data-and-state">Data & State Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
</ul>
</div>
