---
sidebar_label: "Data & State"
---

# Data & State Questions

Questions about data modeling, caching, and state management come up in almost every senior frontend interview. They're where you can demonstrate the kind of thinking that is rare at mid-level: understanding *why* a pattern exists, not just *how* to use it.

---

## Why not just store the balance?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Most tutorials store a balance field directly on the account. What's wrong with that in a financial application?</div>

<div class="interview-a">

A stored balance creates two independent representations of the same reality: the balance field and the transaction history. In a distributed system, any time you have two representations of the same fact, you've created the possibility that they disagree.

Consider this sequence: a transfer runs, the balance is updated, the server crashes before the transaction record is written. Now the balance says $700 but transaction history shows no $300 debit. Both look authoritative. Neither is clearly wrong. Support can't tell the customer what happened.

This isn't a hypothetical: it's a class of bug that has triggered real regulatory investigations.

The ledger-first approach eliminates the problem structurally: the balance is not stored, it is *computed* from the transaction entries. `computeBalance(entries)` reduces every credit and debit for an account. The balance and the history are the same data viewed two ways. They cannot disagree because they derive from the same source.

The cost is O(n) computation per balance read. At thousands of entries per account, this requires periodic snapshots: saved checkpoints that let reads start from a known-good position rather than the full history. But the architecture never changes: the ledger is always the truth, snapshots are always performance optimisations layered on top.

</div>

<div class="tip">When an interviewer asks about balance storage, they are often also testing whether you understand the consistency implications of distributed writes. Mention the two-write problem (balance update succeeds, transaction record write fails) early, it shows you're thinking about failure modes, not just happy paths.</div>

---

## What is event sourcing and when would you use it?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Explain event sourcing and when it's the right architectural choice versus when it's over-engineering.</div>

<div class="interview-a">

Event sourcing is a pattern where you store the *events* that caused state changes rather than storing the current state itself. The current state is a projection: a computation over the event log.

**When it's the right choice:**

- Financial systems where every transaction must be auditable and reconstructable
- Systems where you need to answer questions about historical state ("what was this account's balance on March 15th?")
- Systems where you need to add new views of the data later without migrating existing records (add a new projection function, not a new column)
- Systems with complex concurrent writes where you need a clear ordering of events

**When it's over-engineering:**

- Systems where historical state is not important
- High-frequency data where entries accumulate extremely fast (IoT sensors, trading tick data) and the snapshot infrastructure becomes operationally complex
- Small teams without the operational maturity to manage snapshot scheduling and replay logic
- Systems where read performance is critical and O(n) scans at scale are unacceptable without significant investment in the snapshot layer

**The honest tradeoff:**

Event sourcing shifts complexity from writes (simple appends) to reads (projections). It makes writes fast and reliable. It makes reads potentially expensive unless you invest in a snapshot/CQRS layer. For Stratos Wallet, the write simplicity and auditability are worth the O(n) read cost at demo scale, and the architecture evolves cleanly to snapshots when needed.

</div>

---

## Explain React Query's caching model

<span class="diff diff--senior">Senior</span>

<div class="interview-q">How does React Query's cache work? What's the difference between staleTime, gcTime, and what triggers a background refetch?</div>

<div class="interview-a">

React Query's cache is a key-value store mapping query keys to query state. Each entry can be in one of several states:

**fresh**: data was fetched recently, within `staleTime`. React Query will serve it from cache without network requests.

**stale**: `staleTime` has elapsed. The data is still in cache and will be served immediately, but React Query will also trigger a background network request to refresh it. This is the "stale-while-revalidate" pattern: the user sees data instantly; it updates in the background.

**fetching**: a network request is in flight.

**paused**: a request is queued but blocked (e.g., the device is offline).

**inactive**: no component is currently subscribed to this data. After `gcTime` elapses, the data is garbage collected from memory.

Background refetches are triggered by:
- A component mounts that subscribes to a stale query
- The window regains focus (if `refetchOnWindowFocus: true`)
- `queryClient.invalidateQueries()` is called: this marks matching queries as stale and triggers an immediate background refetch

**In Stratos Wallet:**

`staleTime: 30_000`: balance data is considered fresh for 30 seconds. WebSocket events invalidate the specific accounts after transfers, so the stale time is a safety net for when WebSocket is degraded, not the primary refresh mechanism.

`gcTime: 300_000`: unused data stays in memory for 5 minutes. If a user navigates away from the accounts page and returns within 5 minutes, they see their last-known balance immediately while the background refetch completes.

`retry: false` for mutations: financial mutations should not auto-retry. A retry of a failed transfer could create a duplicate if the idempotency key logic has any edge case. We require explicit user action to retry.

</div>

---

## What's targeted cache invalidation and why does it matter?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">After a transfer, which queries would you invalidate and why wouldn't you just invalidate everything?</div>

<div class="interview-a">

After a transfer from account A to account B, `onSettled` invalidates a named set: every query that is a **projection of the ledger** and could plausibly have changed:

```ts
queryClient.invalidateQueries({ queryKey: ['Accounts'] });
queryClient.invalidateQueries({ queryKey: ['Wallets'] });
queryClient.invalidateQueries({ queryKey: ['BalanceHistory'] });
queryClient.invalidateQueries({ queryKey: ['SpendingByCategory'] });
queryClient.invalidateQueries({ queryKey: ['Transactions.infinite'] });
```

**Why is this "targeted" if it's five keys, not one?**

"Targeted" doesn't mean "as few as possible": it means **named and deliberate**, scoped to what the mutation actually touches. A transfer changes two account balances, which can shift the wallet summary, the 30-day trend, the spending breakdown, and it obviously creates a new transaction row. All five are real, causal consequences of the write. What targeted invalidation *excludes* is everything that has no causal relationship to a transfer: auth/session state, UI preferences, another wallet's data.

**The real contrast, a genuinely blanket invalidation:**

This codebase has one, deliberately, in `ChaosContext.tsx`:

```ts
async function syncChaosConfig(config: ChaosState) {
  await fetch('/chaos/config', { method: 'POST', body: JSON.stringify(config) });
  queryClient.invalidateQueries();   // no key: invalidate literally everything
}
```

That's correct *there* because changing the chaos config can affect any query in the app: there's no way to name a subset. It would be wrong to do that after a transfer, where the affected set is small and known. The skill isn't "always invalidate one key": it's knowing whether you can *name* the true blast radius of a mutation, and invalidating exactly that, no more and no less.

**The edge case:**

Balance history (`computeBalanceHistory`) is a 30-day trend. A single transfer does update today's data point, and it's included in the invalidation set above, but if it weren't, that would be a defensible product decision too: a chart can tolerate a slightly stale point in a way a live balance can't. Whether a given projection needs *immediate* invalidation or can wait for its next natural stale cycle is a product call, not a technical one: the point is that you make it deliberately, key by key.

</div>

---

## A real-time feed and a balance display disagree, how do you find and fix it?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">A live "Activity" feed shows a transaction just happened, but the account balance three tabs over hasn't moved. What's your hypothesis, and how do you fix it structurally rather than patching the symptom?</div>

<div class="interview-a">

My first hypothesis is that the real-time event and the queryable data have **two different write paths**: the event is updating some client-side view directly (a cache splice, local state) without ever writing to the actual store that balance queries read from. If that's true, the feed and the balance aren't disagreeing by accident; they're structurally incapable of agreeing, because only one of them is backed by the source of truth.

This is exactly a bug this project had: a WebSocket "new transaction" push updated the transaction list's React Query cache directly via `setQueriesData`, but never touched the ledger `computeBalance()` reads from. The transaction *looked* real in the feed and disappeared the moment the list was refetched: it was never in the data.

**The fix is structural, not a patch:** create one write function the ledger's owner exposes (`addLedgerEntry`), and require every caller (the transfer mutation *and* the WebSocket handler) to go through it. Once the WS handler's job is "append to the real ledger, then invalidate the same keys a transfer invalidates" instead of "hand-edit the cache to look right," the feed and the balance can't disagree anymore, because they're now reading the same underlying write.

**The general principle:** if two views of "the same fact" can independently show different answers, you don't have one fact with a display bug: you have two facts pretending to be one. The fix is never "make the two caches agree harder"; it's collapsing them to one write path so disagreement becomes structurally impossible.

</div>

<div class="stratos-related">
<h4>Related in this project</h4>
<ul>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
<li><a href="../adrs/state-management">State Management Strategy</a></li>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
<li><a href="../adrs/single-ledger-write-path">Single Ledger Write Path</a></li>
<li><a href="../stories/nates-missing-thousands">Story: Nate's Missing Thousands</a></li>
<li><a href="../stories/sams-invisible-bug">Story: Sam's Invisible Bug</a></li>
<li><a href="../stories/the-feed-that-lied">Story: The Feed That Lied</a></li>
</ul>
</div>
