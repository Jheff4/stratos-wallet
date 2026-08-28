---
sidebar_label: "Nate's Missing Thousands"
---

# Nate's Missing Thousands

*Concept: Ledger-first data model · Event sourcing*

---

Nate is a backend engineer at a Nigerian fintech startup. It's a Thursday morning. His manager, Ada, walks over with a look he's learned to dread: the quiet one.

"We have a problem," she says. "Our fee calculation has been wrong for three months. We were charging 10% on every transfer. It was supposed to be 1%."

Nate opens his laptop. He pulls up the accounts table.

```
accounts
───────────────────────────
id        | balance
───────────────────────────
acc_001   | ₦230,400
acc_002   | ₦89,150
acc_003   | ₦1,244,000
```

He stares at the numbers. Then he asks the question he already knows the answer to.

"What were the balances supposed to be?"

Ada pauses. "We don't know."

And that's when Nate understands the size of the problem. The correct balances no longer exist anywhere. Every time a user made a transfer, the code computed the wrong fee, deducted it from `acc.balance`, and wrote the result back over the old value. Three months of overwrites. The history, the reason the balance is what it is, is gone.

They spend the next two weeks reconstructing what they can from payment processor logs, customer records, and application logs that were never designed for this purpose. They get estimates. They issue partial refunds. Some users accept it. Some file complaints with the CBN. The legal bill alone is larger than the entire engineering budget for that quarter.

---

Now rewind. Same company, different architecture.

Same bug. Same three months of wrong fees. Nate's phone still rings on a Thursday morning.

But this time, he doesn't open an accounts table. He opens the ledger.

```
ledger_entries
─────────────────────────────────────────────────────────────────
id     | account_id | amount      | type   | created_at
─────────────────────────────────────────────────────────────────
e_001  | acc_001    | +500,000    | deposit    | 2024-01-01
e_002  | acc_001    | -200,000    | withdrawal | 2024-01-03
e_003  | acc_001    | -4,800      | fee        | 2024-01-03  ← should be ₦480
e_004  | acc_001    | -300,000    | transfer   | 2024-01-15
...
```

The entries are still there. Every single one. They were never overwritten because they can't be: the ledger is append-only. The bug was in `computeBalance()`, not in the data. The function was multiplying by the wrong percentage. The data itself was always correct.

Nate fixes the function. One commit.

Then he re-runs `computeBalance()` over every account in the system. It takes four minutes.

Every balance is now correct. Provably, exactly, verifiably correct, because the balances are derived from the entries, and the entries were always honest about what happened. Not estimates. Not reconstructions. The actual truth.

Ada doesn't have to call the CBN.

---

## What this is really about

The difference between these two systems isn't a language choice or a framework choice. It's a question about what you treat as the source of truth.

In the first system, the balance *is* the truth. It's a number you trust. When it's wrong, you have no ground to stand on.

In the second system, the balance is an *answer* derived from the truth. The truth is the sequence of events. When the answer is wrong, you fix the formula and recompute. The events are permanent.

This is why Stratos Wallet stores ledger entries and computes everything else. The balance you see in the UI is the output of `computeBalance(entries)`. The chart is the output of `computeBalanceHistory(entries)`. The spending breakdown is the output of `computeSpendingByCategory(entries)`. All of them derive from the same immutable source.

If any of those functions ever have a bug, and they will, the fix is a code change, not a data recovery operation.

**The engineering principle:** Store events, derive state. Never the reverse.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
<li><a href="../interview/data-and-state">Interview: Data & State Questions</a></li>
<li><a href="../interview/behavioural">Interview: Tell me about a hard architectural decision</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./sams-invisible-bug">Sam's Invisible Bug: when the ledger gets slow at scale</a></li>
<li><a href="./two-filing-cabinets">The Two Filing Cabinets: one data store, enforced</a></li>
</ul>
</div>
