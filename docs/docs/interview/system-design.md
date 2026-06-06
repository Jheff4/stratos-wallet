---
sidebar_label: "System Design"
---

# System Design Questions

These are the high-signal questions. Interviewers at Stripe, Coinbase, and Ramp use system design to separate candidates who understand how systems fail from those who only understand how they work.

---

## Design a real-time balance display that is always accurate

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Design the frontend architecture for a wallet balance display. The balance must update in real time, handle network interruptions gracefully, and never show a stale or incorrect value to the user.</div>

<div class="interview-a">

I'd structure this across four layers that work together.

**Layer 1 — The data model.**

The balance is never stored. It is derived from an append-only ledger of transactions. `computeBalance(ledgerEntries)` reduces all credits and debits for an account into a current total. This means:
- There is only one source of truth, so balance and history can never disagree
- If there's a bug in the computation, fixing the function corrects all balances retroactively
- Any historical balance is reconstructable by replaying entries up to a point in time

The GraphQL schema exposes `Account.balance` as a resolver-computed field, not a stored column.

**Layer 2 — The cache layer.**

React Query manages the server state. Cache keys are namespaced: `['accounts', walletId]`. `staleTime` is short — 30 seconds — because balances change frequently. On every successful transfer mutation, I invalidate `['accounts', fromId]` and `['accounts', toId]` to force an immediate refetch of only the affected accounts.

**Layer 3 — The real-time layer.**

A WebSocket connection pushes balance-affecting events. The connection protocol guarantees reliability through three mechanisms:
1. **Sequence numbers** — every event carries a monotonically increasing `seq`. On reconnect, the client sends its `lastSeq` and the server replays any missed events from its buffer.
2. **Event deduplication** — every event carries a unique `eventId`. A bounded set of seen IDs discards duplicates from at-least-once delivery.
3. **Exponential backoff** — reconnections use `min(1000 × 2^attempt + jitter, 30s)` to prevent thundering herd.

**Layer 4 — The consistency guarantee.**

After every mutation — success or failure — I call `queryClient.invalidateQueries()` for the affected accounts. This ensures the displayed balance is always the server's authoritative value, not the optimistic assumption. The optimistic update provides instant feedback; the invalidation ensures correctness.

**What I'd add at scale:**

Balance history queries become expensive as ledger entries accumulate — O(n) per account. Production systems solve this with periodic balance snapshots: a saved checkpoint at time T, so reads only replay entries after T rather than the full history.

</div>

<div class="tip">The interviewer is listening for: do you think about failure modes before they prompt you? Mentioning "sequence numbers for missed events" and "snapshots for O(n) performance" without being asked signals staff-level thinking.</div>

---

## Design the state management architecture for a fintech dashboard

<span class="diff diff--senior">Senior</span>

<div class="interview-q">How would you structure state management for a dashboard with live balances, transaction history, spending analytics, and transfer flows? What state lives where?</div>

<div class="interview-a">

I separate state into three categories with different storage:

**Server state → React Query.**

Anything that originates from or is authorised by the backend: wallet data, account balances, transaction history, spending analytics. React Query is the right tool because it handles caching, deduplication of in-flight requests, background refetching, and optimistic mutations with rollback — all without me writing that infrastructure myself.

Cache keys are scoped to the data's identity:
```
['wallets']
['accounts', walletId]
['transactions', { accountId, cursor }]
['balance-history', walletId]
```

This scoping makes targeted invalidation precise: a transfer mutation invalidates only the affected accounts, not the entire cache.

**Global client state → Zustand.**

Session data (authenticated user, token), UI preferences (theme, selected wallet). These are client-owned — the backend doesn't have an opinion on them — and they need to be accessible across unrelated components. Zustand's minimal API keeps this lean.

**Local UI state → useState / useReducer.**

Form inputs, modal open/closed, loading indicators tied to a single component. This never belongs in global state. Hoisting it globally would make components harder to test and refactor.

**The rule:**

Use the most local storage that works. Only promote state upward when two or more genuinely unrelated components need it. If you find yourself reaching for Zustand for something one component uses, question whether it belongs there at all.

</div>

<div class="tip">The distinction between server state and client state is the most important concept in modern React architecture. React Query exists because server state has fundamentally different semantics: it can be stale, it can be fetching, it can be paused. Those states don't make sense for `useState`. Articulating this clearly in an interview immediately signals you understand why these tools exist, not just how to use them.</div>

---

## How would you handle a transfer that might have been submitted twice?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">A user taps "Transfer" and the network drops before the response arrives. They tap again. How do you ensure the transfer only executes once?</div>

<div class="interview-a">

Idempotency key, generated client-side before the request, sent with every attempt.

```ts
// Generated once when the form mounts — not on every tap
const idempotencyKey = useRef(crypto.randomUUID());

// The same key is sent on every retry of the same user action
mutate({ fromAccountId, toAccountId, amount, idempotencyKey: idempotencyKey.current });
```

The server stores the result of the first successful execution keyed by this ID:

```ts
if (idempotencyStore.has(idempotencyKey)) {
  return idempotencyStore.get(idempotencyKey); // return cached result
}
// execute transfer, store result keyed by idempotencyKey
```

When the second request arrives with the same key, the server returns the stored result without executing the transfer again.

After a successful transfer, I generate a new key so the next transfer is treated as a fresh operation.

**Why client-generated?**

Server-generated keys require a round-trip before the form can be submitted, adding latency. Client-generated UUIDs are cryptographically random enough to have no practical collision risk at any scale, and they're available immediately.

**What about the idempotency store on the server?**

In production it needs a TTL — typically 24 hours to a week, depending on retry windows — and it needs to survive server restarts (so a database, not in-memory). In Stratos Wallet's mock layer it's an in-memory Map, which is appropriate for a development environment.

</div>

---

## Design a transaction history that works at scale

<span class="diff diff--staff">Staff</span>

<div class="interview-q">The transaction history needs to support infinite scroll, real-time updates, and millions of records per account. How do you design this?</div>

<div class="interview-a">

Three problems to solve: pagination, real-time consistency, and the scale challenge.

**Pagination: cursor-based, not offset.**

Offset pagination (`LIMIT 100 OFFSET 200`) breaks when new items are inserted during scrolling. If a new transaction comes in at the top while the user is on page 3, every subsequent page is shifted by one. The user sees a duplicate or misses an item.

Cursor pagination (`after: lastSeenId`) is stable: "give me the 20 items after this specific transaction." New items at the top don't affect the cursor position of older items.

```graphql
transactions(accountId: ID, first: Int, after: String): TransactionConnection
```

React Query's `useInfiniteQuery` manages the cursor chain automatically.

**Real-time updates: merge at the top, don't re-fetch.**

When a new transaction arrives via WebSocket, I add it to the front of the React Query cache directly, without refetching the entire list:

```ts
queryClient.setQueryData(['transactions', accountId], (old) => ({
  pages: [
    { edges: [{ node: newTransaction, cursor: newTransaction.id }], ...old.pages[0] },
    ...old.pages.slice(1),
  ],
  pageParams: old.pageParams,
}));
```

Re-fetching the list on every new transaction would reset scroll position and re-render the entire feed. In-place cache update is surgical.

**At scale — the deduplication problem.**

If the user has the feed open for a long time, a transaction might arrive via WebSocket and then appear again in the next paginated fetch. I deduplicate by `id` before rendering:

```ts
const uniqueTransactions = Array.from(
  new Map(allTransactions.map(t => [t.id, t])).values()
);
```

**At very high scale — the ledger performance problem.**

A transaction history that's O(n) per account — scanning the entire ledger on every request — breaks at millions of entries per account. The production solution is: use a dedicated read model for transaction history (a pre-indexed table ordered by `createdAt desc, id`), separate from the ledger which is ordered by append time. The ledger remains the source of truth; the read model is an indexed projection optimised for query.

</div>

---

## How do you test a real-time WebSocket system?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Your WebSocket feed has deduplication, sequence tracking, and replay. How do you verify these actually work?</div>

<div class="interview-a">

Three layers of testing, each targeting different failure modes.

**Unit tests — the deduplication logic.**

Test the `isDuplicate()` function in isolation: given a set of seen event IDs, does it correctly return true for duplicates and false for new events? Does it evict the oldest ID when the window is full? Does it handle events without an `eventId` gracefully?

These are pure function tests — no WebSocket required.

**Integration tests — the full mutation flow.**

Using MSW to intercept the GraphQL mutation, test the three-phase optimistic update cycle:
1. `onMutate` — does the cache update immediately?
2. `onError` — does the snapshot restore correctly?
3. `onSettled` — does invalidation trigger a refetch?

These run in jsdom with React Testing Library and don't need a real server.

**Chaos tests — the reliability protocol.**

Enable `duplicateWsEvents` chaos preset and verify the feed doesn't show duplicate transactions. Enable `websocketInstability` and verify the balance is correct after reconnection. Enable `packetLoss` and verify the "sequence gap detected" log entry appears.

These tests run against the full application with the chaos system active — the closest thing to production conditions in a development environment.

**The principle:**

Don't test implementation details — test observable behaviour. The test for deduplication is not "was `seenEventIds.add()` called?" — it's "does the transaction appear once in the feed, not twice?" The deduplication mechanism can change; the observable contract should not.

</div>

<div class="stratos-related">
<h4>Related in this project</h4>
<ul>
<li><a href="../adrs/websocket-reliability-protocol">WebSocket Reliability Protocol</a></li>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
<li><a href="../stories/azeez-in-the-tunnel">Story: Azeez in the Tunnel</a></li>
<li><a href="../stories/nates-missing-thousands">Story: Nate's Missing Thousands</a></li>
</ul>
</div>
