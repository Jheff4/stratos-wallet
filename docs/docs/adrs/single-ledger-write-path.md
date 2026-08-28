# Single Ledger Write Path

## Context

[Ledger-First Data Model](./ledger-first-data-model) establishes that every balance is *derived* from an append-only ledger, never stored. That principle only holds if there is exactly one way to add an entry to the ledger.

For a while, this project quietly had two. The `TransferFunds` mutation appended to the ledger array directly (`ledger.unshift(newTransaction)`). Separately, the WebSocket's live transaction feed patched the **React Query cache** for the transaction list directly (`queryClient.setQueriesData(...)`). It never touched the ledger array at all.

The consequence: a WS-pushed "transaction" appeared in the Activity feed and Transaction History, but `computeBalance()`, which only ever reads the ledger array, never saw it. Balances silently disagreed with the feed showing them change. Worse, the phantom entry existed only in the cache: the moment the transaction list was refetched (pagination, reload), it read the real ledger and the entry vanished without a trace.

This is the same *shape* of bug as [the single wallet registry fix](./ledger-first-data-model#single-wallet-registry): a second entry point that lets two "sources of truth" drift apart, applied to the write side of the ledger instead of the wallet store.

## Decision

There is exactly one function that may append to the ledger:

```ts
// mocks/data.ts
export function addLedgerEntry(entry: LedgerEntry): LedgerEntry {
  ledger.unshift(entry);
  return entry;
}
```

Every caller that creates a transaction (the `TransferFunds` mutation handler and the WebSocket subscription handler) calls this function. Neither touches the `ledger` array directly.

The WebSocket handler's responsibility changes accordingly. It no longer hand-edits the transaction list's cache to *look* updated. It:

1. Calls `addLedgerEntry(incoming)`: the transaction is now real, in the one place every projection reads from.
2. Invalidates the same query keys a transfer's `onSettled` invalidates: `Accounts`, `Wallets`, `BalanceHistory`, `SpendingByCategory`, `Transactions.infinite`.

One write path, one invalidation set. A transaction arriving over WebSocket and a transaction created by a transfer are now indistinguishable to every downstream consumer.

## Alternatives Considered

- **Keep the cache splice, but also write to the ledger.** Rejected: this keeps two code paths doing overlapping work (manually shaping cache data *and* writing the real store). They will drift again the next time either one is edited without the other in mind. A single required door is the only way to make the bug structurally impossible rather than just currently fixed.
- **Make the WebSocket server the ledger's owner.** The ledger lives in browser memory (`mocks/data.ts`, read by the MSW handlers running in the page's JS context); the WS server is a separate Node process with no access to that memory. Making it authoritative would require a real cross-process sync mechanism, legitimate for a production system with a real database, but disproportionate for a mock layer whose entire job is to model the client-side data flow. The client already owns the ledger; the fix is making it the only place that's true.
- **Have the client refetch instead of writing locally.** On receiving a WS event, call `queryClient.invalidateQueries()` without writing anything, forcing a full refetch. Rejected for this mock layer specifically: the WS server *generates* the transaction payload itself (it doesn't exist anywhere else to refetch), so the client must be the one to persist it. In a real system backed by an actual database, this alternative is exactly right: the event would just signal "something changed, go refetch the truth."

## Consequences

- Activity feed, Transaction History, and every balance display are now guaranteed to agree: they are reading the same underlying array.
- WS-pushed transactions survive a refetch, because they are real ledger entries, not cache decoration.
- The WebSocket handler is simpler: it delegates to the same write function and invalidation set a transfer already uses, instead of maintaining bespoke cache-splicing logic.
- Anyone adding a third way to create a transaction (e.g. a future webhook handler for a real PSP) has an obvious, enforced door to walk through.

## Interview discussion points

> "A real-time feed and a balance display disagree: what's your hypothesis?"

Two write paths for the same fact. Find where each one is written, and check whether they share a store. If they don't, no amount of "keep them in sync" logic fixes it permanently: collapse them to one write path instead.

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/the-feed-that-lied">The Feed That Lied: the phantom transaction bug</a></li>
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
<li><a href="./ledger-first-data-model">Ledger-First Data Model</a></li>
<li><a href="./websocket-reliability-protocol">WebSocket Reliability Protocol</a></li>
</ul>
</div>
