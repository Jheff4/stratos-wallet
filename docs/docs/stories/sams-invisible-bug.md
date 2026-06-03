---
sidebar_label: "Sam's Invisible Bug"
---

# Sam's Invisible Bug

*Concept: O(n) performance · Ledger snapshots*

---

Sam's fintech startup is three years old. It has 400,000 active users. The most active traders have been with the company since day one and have made thousands of transactions.

One Tuesday morning, Sam's performance monitoring dashboard shows an alert: P95 API latency for the `/balance` endpoint has climbed from 18ms to 4,200ms. The 95th slowest request in every hundred is taking over four seconds to respond.

She digs in. The endpoint calls `computeBalance(entries)`, which scans every ledger entry for an account and sums them up.

For a new user with 20 entries, this takes a fraction of a millisecond.

For the power users who joined three years ago and make five transactions a day, this means scanning over 5,000 entries. Every. Single. Time. The balance is requested.

The startup's most loyal, most active users — the ones responsible for the most revenue — are getting the worst experience.

Sam runs a quick calculation:

```
5,000 entries × 400 active power users requesting balance simultaneously
= 2,000,000 ledger row reads to compute 400 balance numbers
```

And this is just during morning rush. Peak hours bring 10x the traffic.

---

She could switch to stored balances. Keep a `balance` column on the account. Update it on every transaction write.

But she's read the post-mortem from when a competitor did exactly that and ended up with balances that disagreed with transaction histories after a database hiccup during a peak traffic moment. They had to freeze withdrawals for six hours while they reconciled. Three regulatory inquiries followed.

She doesn't want that class of problem. She wants the ledger. She just needs the ledger to be fast.

---

The answer is snapshots.

A snapshot is a saved result of `computeBalance()` at a specific point in time. Instead of scanning the entire ledger, you load the snapshot and scan only the entries that came after it.

```
// Before snapshots: scan everything, every time
computeBalance(allEntries)                        // O(n) — 5,000 entries scanned

// After snapshots: scan only recent entries
computeBalanceFromSnapshot(snapshot, recentEntries)  // O(k) — maybe 50 entries scanned
```

`n` was the total number of entries — growing with every transaction, forever.  
`k` is the number of entries since the last snapshot — bounded by how often you take snapshots.

If Sam takes a daily midnight snapshot, `k` is at most the number of transactions in the last 24 hours. For even the most active user, that's maybe 10–20 entries. Not 5,000.

---

## The snapshot process

Every night at midnight, a background job runs:

1. For every account, call `computeBalance(allEntries)` once.
2. Save the result as a snapshot: `{ accountId, balance, snapshotAt: '2026-06-01T00:00:00Z' }`.

When a balance request comes in during the day:

1. Load the most recent snapshot for this account.
2. Find all ledger entries with `createdAt > snapshot.snapshotAt`.
3. Start from `snapshot.balance` and apply only those recent entries.

```ts
function computeBalanceFromSnapshot(
  snapshot: BalanceSnapshot,
  recentEntries: LedgerEntry[]
): number {
  return recentEntries.reduce((sum, entry) => {
    if (entry.destinationAccountId === snapshot.accountId) return sum + entry.amount;
    if (entry.sourceAccountId === snapshot.accountId)      return sum - entry.amount;
    return sum;
  }, snapshot.balance);  // start from the saved checkpoint
}
```

---

## The ledger is unchanged

Here's the part Sam appreciates most about this solution: she didn't change what she writes.

The ledger is still append-only. Every transaction still creates a `LedgerEntry`. The truth is still in the events. She didn't introduce a mutable balance field. She didn't create the two-source-of-truth problem.

The snapshot is a read optimisation, not a new source of truth. It's the ledger saying: "as of midnight, we had computed up to this point and the result was $4,230. You only need to scan what happened after that."

If a snapshot is ever wrong — due to a bug in the snapshot job, a clock error, anything — you throw it away and recompute from the full ledger. The ledger is always there. The snapshot is a convenience.

---

## The dictionary analogy

A physical dictionary is 1,400 pages. Finding a word means reading 1,400 pages.

But nobody does that. They open to roughly the right section using the tabs on the edge. "D" starts around page 280. They've effectively skipped to a snapshot — a saved position in the book.

They then scan 30 pages instead of 1,400.

The dictionary's content didn't change. The words are all still in alphabetical order. The tabs are just a navigational shortcut. They make reading the same book dramatically faster.

Snapshots are the tabs on your ledger.

---

## What Sam builds at Stratos Wallet scale

For Stratos Wallet today, none of this is necessary. Demo accounts have dozens of entries. `O(n)` at that scale is imperceptible — single-digit milliseconds.

But the code is designed so that adding snapshots later is an additive change, not a rewrite. The ledger stays untouched. `computeBalance()` stays the same — it's just called with a shorter slice of entries starting from the snapshot rather than from the beginning.

The architectural understanding to carry forward:

1. **Today:** `computeBalance(allEntries)` — correct, simple, fast enough at this scale.
2. **At scale:** `computeBalanceFromSnapshot(snapshot, recentEntries)` — same logic, different starting point.
3. **Never:** store the balance as a mutable field — that's the path that leads to Sam's competitor's 6-hour freeze and three regulatory inquiries.

---

## What this is really about

`O(n)` is not a problem to fear — it is information. It tells you exactly where the cost is and exactly how it grows. When entries are 20, O(n) is nothing. When entries are 5,000, O(n) needs addressing. The solution — snapshots — is already implicit in the ledger-first design. You don't redesign the system. You add a checkpoint mechanism that lets you skip ahead.

Understanding this tradeoff and its evolution path is the difference between someone who says "ledger-first is better" and someone who can defend that choice all the way through a staff-level system design interview, including when an interviewer asks "but doesn't that make balance reads slow at scale?"

**The engineering principle:** Understand the cost of your design at every scale. O(n) balance reads are correct and appropriate now. At scale, snapshots solve the performance problem without abandoning the ledger. Store events. Derive state. Add read optimisations when the data proves it's time.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/008-ledger-first-data-model">ADR 008 — Ledger-First Data Model (snapshots section)</a></li>
<li><a href="../interview/data-and-state">Interview: What is event sourcing and when would you use it?</a></li>
<li><a href="../interview/system-design">Interview: Design a transaction history that scales</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./nates-missing-thousands">Nate's Missing Thousands — why the ledger is the right foundation</a></li>
</ul>
</div>
