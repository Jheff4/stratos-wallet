---
sidebar_label: "The Feed That Lied"
---

# The Feed That Lied

*Concept: single write path · derived state can only be as honest as its source*

---

Kemi had just wired up the live Activity feed, and it was, in her own private opinion, the best-looking thing in the app.

Every few seconds a new row slid in (a salary deposit, an ATM withdrawal, a transfer between accounts), each one badged, timestamped, colour-coded by type. She left it running on a second monitor while she worked on something else, glancing over now and then just to watch the system breathe. It looked *alive*. It looked like a real bank's operations dashboard.

Then, for no particular reason, she flipped to the Accounts tab to check something unrelated.

The balance hadn't moved.

She flipped back to Activity. Another deposit had just slid in: $340, "Interest payment," account `a1`. She flipped to Accounts again. Same number as five minutes ago, same as an hour ago. Dozens of transactions had scrolled past on the other tab. Not one of them had touched a single balance.

---

Her first thought was a rendering bug: maybe Accounts just wasn't re-rendering on the new data. She checked: no, the query was firing, the component was fine. It was returning the *same number* every time, correctly. The balance genuinely hadn't changed.

So she went looking for where a "transaction" actually became a transaction. She found the WebSocket handler that fed the Activity page:

```ts
queryClient.setQueriesData(
  { queryKey: ['Transactions.infinite'] },
  (old) => {
    // ...splice the new transaction into the cached pages...
  },
);
```

That was it. That was the whole trick. When a WS event arrived, this code reached directly into React Query's cache and *inserted* a transaction-shaped object into the list everyone was already looking at. It never went near the ledger: the actual array `computeBalance()` scans to work out what anyone owns. The feed wasn't reporting transactions. It was performing them.

She scrolled the Transaction History page far enough to trigger a refetch, out of curiosity. The "Interest payment" she'd just watched arrive vanished. Of course it did: it had never existed anywhere except in a cache entry she'd just asked React Query to discard and refetch from the one place that was actually real.

---

She'd seen this shape of bug once before, in a different part of the app: two wallet stores that quietly drifted apart because nothing forced them to agree. This was the same lesson wearing a different costume. It wasn't "the Activity feed has a bug." It was: **there were two ways to become a transaction in this app, and only one of them was real.**

The fix wasn't to make the fake path smarter: to also update the balance display, and the spending chart, and the history trend, chasing every place a real transaction touches. That's an arms race with no finish line; every new feature that reads the ledger becomes one more place the fake path has to remember to fake. The fix was to delete the fake path entirely.

```ts
// mocks/data.ts: the one door
export function addLedgerEntry(entry: LedgerEntry): LedgerEntry {
  ledger.unshift(entry);
  return entry;
}
```

Now the WebSocket handler doesn't shape a cache to look correct. It writes the entry through the same door a transfer uses, then asks for exactly what a transfer asks for: refetch `Accounts`, `Wallets`, `BalanceHistory`, `SpendingByCategory`, `Transactions.infinite`. It doesn't need to know what any of those five look like. It just needs to know they're the parts of the app that depend on the ledger, and the ledger just changed.

She reloaded both tabs side by side. A deposit slid into Activity. The balance on Accounts ticked up in the exact same instant. She watched it happen three more times, just to be sure it wasn't a coincidence.

---

## What this is really about

A live feed is a *view* of something happening. It is not the thing happening. The moment a view can update itself without the underlying fact also updating, the view has become a second, competing fact, and it will always eventually say something the real one doesn't, because nothing forces them to agree.

The tell, in hindsight, was obvious: the fix for a display that lies is never to make the lie more convincing (patch every place it might get caught). It's to find the one true door and require everything to walk through it. A transaction that arrives over a WebSocket and a transaction created by a transfer should be *indistinguishable* to everything downstream: same write function, same ripple of invalidation. If you can tell them apart by which parts of the app they update, you don't have one kind of transaction. You have two, and only one of them is honest.

**The engineering principle:** derived state is only as trustworthy as its source. If a value can be updated two different ways, it isn't one fact: it's two facts pretending to agree, and eventually they won't.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/single-ledger-write-path">Single Ledger Write Path (ADR)</a></li>
<li><a href="../interview/data-and-state">Interview: A real-time feed and a balance display disagree, how do you fix it?</a></li>
<li><a href="../quiz/mocking-and-data-flow">Quiz: Mocking & Data Flow</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./two-filing-cabinets">The Two Filing Cabinets: one store, no drift</a></li>
<li><a href="./the-chaos-that-wouldnt-happen">The Chaos That Wouldn't Happen: state across a boundary</a></li>
</ul>
</div>
