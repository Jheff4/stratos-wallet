---
sidebar_label: "The Two Filing Cabinets"
---

# The Two Filing Cabinets

*Concept: Single data store · The dual wallet bug*

---

Jon is building a fintech app for the first time. He's smart, he moves fast, and he makes a decision early on that feels completely reasonable.

He sets up two storage mechanisms for wallets. The first is a static list, a hardcoded array of the original demo wallets he used during development. The second is a Map that stores dynamically created wallets for registered users. He figures this is tidy: the demo data lives in one place, the real user data lives in another.

He ships the feature. Everything works. He tests the demo flow: logs in as the admin user, sees the wallet, checks the balance history. Beautiful.

Two weeks later, a colleague signs up as a new user. The registration flow works. The wallet is created. The balance shows correctly on the accounts page.

She clicks on Balance History.

Empty.

She refreshes. Still empty. She files a bug report. Jon looks into it.

He traces the code. The balance history function does this:

```ts
const wallet = wallets.find(w => w.id === walletId);  // searches the static array
if (!wallet) return [];                                // wallet not in array → empty
```

And the registration flow does this:

```ts
walletsByUser.set(userId, wallet);  // stores in the Map
```

The two stores never talk to each other. Her wallet is real. It exists. But `computeBalanceHistory()` is looking in the wrong cabinet. It searches the static array, finds nothing, and silently returns an empty list.

No error. No crash. Just wrong.

---

Jon stares at this for a while.

The bug is not actually the missing `if` statement or the wrong data structure. The bug is that he created two sources of truth for the same thing. The moment he did that, he made divergence possible. The only question was how long before it happened.

The fix is structural, not surgical. He removes the static array. He seeds the Map with the original demo wallets at startup. Every function that needs wallet data (balance history, account lookup, transfer validation) goes through the Map. Every new wallet created goes into the Map. There is no second cabinet.

```ts
// Before: two stores, guaranteed to diverge
const wallets = [{ id: 'w1', ... }];         // static array
const walletsByUser = new Map();              // dynamic map

// After: one store, consulted by everything
const walletsByUser = new Map([
  ['u1', [{ id: 'w1', ... }]]               // seeded at init
]);
```

Once he makes this change, the bug cannot exist. Not because he was more careful. Because the architecture makes the failure structurally impossible.

---

## The filing cabinet metaphor

Imagine a law firm that tracks active cases in two places: a physical binder on the shelf (the original clients) and a computer database (newer clients). One morning a junior associate needs to find all open cases for a client who joined two years ago.

She checks the binder. Not there: she was added to the database.  
She checks the database. Found. But the binder has notes attached that the database entry doesn't have.

Now which one is complete? Which one do you trust in court?

This is the problem Jon had. Two cabinets, same domain, no guarantee of consistency.

Real firms either migrate everything to one system or keep the two strictly separate with explicit synchronisation logic. What they never do is let them drift apart while pretending they're equivalent.

---

## What this is really about

Every experienced engineer has built this bug at least once. It's seductive precisely because it feels like good organisation: "this data here, that data there." But when two data structures represent the same domain, you have created the possibility of them telling different stories.

The rule in Stratos Wallet is: one Map, consulted by all. `getWalletById()`, `getAllWallets()`, `computeBalanceHistory()`, transfer validation: they all go through the same function that reads the same store. You can't have the two-cabinet bug if there's only one cabinet.

**The engineering principle:** One data structure per domain. All access goes through it. Make divergence structurally impossible, not just carefully avoided.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
<li><a href="../interview/behavioural">Interview: Tell me about a bug that was hard to find</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./nates-missing-thousands">Nate's Missing Thousands: the larger ledger principle</a></li>
</ul>
</div>
