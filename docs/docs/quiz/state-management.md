---
sidebar_label: "State Management"
---

# Quiz: State Management

Covers the three categories of state, React Query cache design, targeted invalidation, and optimistic updates. Reference: [ADR: State Management](../adrs/state-management) · [ADR: Idempotency & Optimistic Updates](../adrs/idempotency-and-optimistic-updates).

---

## Question 1: Three categories of state

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Where does each kind of state live in this app, and what's the one-line rule?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

- **Server state** → React Query cache (wallet data, balances, transactions). It's a cache of someone else's data, so it needs staleness, refetching, and invalidation: exactly what React Query provides.
- **Global client state** → Zustand (session, theme). Cross-cutting, but owned by the client.
- **Local UI state** → `useState` (form inputs, modal open/close). Belongs to one component.

The rule: **use the most local storage that works.** Form state never goes in Zustand; wallet data never goes in `useState`. Putting server data in `useState` means you hand-roll caching and invalidation badly; putting form state in a global store creates spooky action at a distance.

</div>
</details>

---

## Question 2: Targeted invalidation

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Why are cache keys namespaced and parameterised (e.g. <code>['accounts', walletId]</code>), and what does that let a transfer do that a flat cache couldn't?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Structured keys let you invalidate **precisely**. A transfer can invalidate `['accounts', fromId]` and `['accounts', toId]` and leave the transaction feed, balance history, and unrelated wallets alone: only the data that actually changed is refetched.

A flat or coarse cache forces a choice between two bad options: invalidate everything (a thundering refetch and UI flicker on every mutation) or invalidate nothing (stale balances). Parameterised keys give you a scalpel instead of a sledgehammer.

</div>
</details>

---

## Question 3: Optimistic updates: the three callbacks

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Walk through <code>onMutate</code> / <code>onError</code> / <code>onSettled</code> for an optimistic transfer. Why must you <code>cancelQueries</code> first, and why invalidate in <code>onSettled</code> even on success?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

- **`onMutate`**: `cancelQueries` first (so an in-flight refetch can't land *after* your optimistic write and clobber it), snapshot the current cache, then apply the expected result so the UI updates instantly.
- **`onError`**: restore the snapshot, roll back so the UI never shows a permanently wrong state.
- **`onSettled`**: invalidate the affected keys regardless of success or failure.

Why invalidate even on success: the optimistic value is a *guess*. The server may have applied a fee, rounded, or reordered. You don't trust your guess *or* your rollback: on settle you ask the server for the truth. Instant feedback (optimism) plus eventual consistency (invalidate) is the whole pattern.

</div>
</details>

---

## Question 4: Optimistic state surviving unmount

<span class="diff diff--staff">Staff</span>

<div class="interview-q">A user starts a transfer, navigates away before it resolves, then returns. Why doesn't the rollback break, and what would break it?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

The snapshot lives in the **React Query cache**, not in component state. So when the component unmounts on navigation, the snapshot and the in-flight mutation survive: the rollback (or invalidation) still has something to act on when the request settles.

What would break it: holding the snapshot in `useState` inside the page component. On unmount that state is gone, so an error after navigation has nothing to roll back to, and the cache is left in the optimistic (possibly wrong) state. Stable cache keys + cache-held snapshots are what make it survive.

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/the-optimistic-chef">The Optimistic Chef: optimistic UI done right</a></li>
<li><a href="../stories/sams-double-transfer">Sam's Double Transfer: idempotency</a></li>
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
<li><a href="../adrs/state-management">State Management Strategy</a></li>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
</ul>
</div>
