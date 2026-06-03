---
sidebar_label: "Nate's Messy Flat"
---

# Nate's Messy Flat

*Concept: Vertical slice architecture*

---

Nate moves into a flat with three roommates. They all work in different fields — Nate's in engineering, Sam's in design, Jon's a writer, Azeez does finance. 

They need a system for organising shared stuff. They try two approaches.

---

**Approach 1: Organise by item type.**

The kitchen has all the food. The garage has all the tools. The office has all the documents. Every type of item lives in its designated zone.

This works fine the first month.

Then Jon needs to write a proposal. He needs: his laptop (office), his reference books (office), a snack (kitchen), a charger (bedroom), and the printer manual (garage because that's where tools live). For one simple task, he crosses the flat six times.

Then Sam's design work grows. She needs physical space for equipment. The office starts filling up with her things and Jon's things and Nate's things, all jumbled together. It's still "the office" but nobody knows whose stuff is whose. Finding anything takes longer every week.

When Nate and Sam both work from home on the same day, they're both in the same zone, reaching past each other, looking through the same drawers for different things.

---

**Approach 2: Organise by person.**

Each roommate has a zone. Nate's zone has Nate's laptop, Nate's reference materials, Nate's charger, Nate's snacks. Same for everyone else.

Jon's proposal now requires Jon to stay in Jon's zone. Everything he needs is there.

When Sam's design work expands, it expands into Sam's space, not a shared space that everyone else has to navigate around.

When Nate and Sam work from home together, they're in different zones. No collisions.

Shared things — the wifi router, the kitchen staples, the vacuum — go in a common area that's clearly labelled as shared. Not one person's zone. Genuinely shared.

---

This is the difference between file-type architecture and vertical slices.

---

## The engineering version

**File-type organisation** (approach 1):

```
src/
  components/
    WalletCard.tsx        ← whose component is this?
    AccountList.tsx
    TransferForm.tsx
    TransactionFeed.tsx
  hooks/
    useWallet.ts
    useAccounts.ts
    useTransfer.ts
  types/
    wallet.ts
    account.ts
    transaction.ts
```

To understand the transfer feature, you visit `components/`, `hooks/`, and `types/`. Three separate drawers. When two engineers work on transfers and accounts at the same time, they're both in `components/` and `hooks/`. Git sees changes to the same directories and often produces merge conflicts on files that have nothing to do with each other.

To delete the trading feature? You'd need to know which components, hooks, and types belong to it — information the directory structure doesn't give you. You have to grep through the code to find it.

---

**Vertical slices** (approach 2):

```
src/features/
  transfers/
    TransferPage.tsx      ← the transfer component
    hooks/useTransfer.ts  ← the transfer hook
    types.ts              ← the transfer types
    transfers.graphql     ← the transfer queries
    __tests__/            ← the transfer tests
  accounts/
    ...all accounts code
  wallets/
    ...all wallets code
src/shared/
  logger.ts               ← genuinely shared
  api/                    ← genuinely shared
  components/
    ErrorBoundary.tsx     ← used by everything
```

To understand the transfer feature: read `features/transfers/`. One folder. Everything you need is there.

To delete the trading feature: delete `features/trading/`. Everything related to it disappears with it.

Two engineers working on transfers and accounts simultaneously work in completely separate trees. Git has nothing to conflict.

---

## The shared zone discipline

The hardest part of the flat's second arrangement is deciding what goes in the common area. Leave it vague and people start dumping things there that aren't really shared — they just weren't sure where else to put them. Eventually the common area becomes a new version of the mess they were trying to escape.

Same problem in code. Leave `shared/` without a clear rule and it fills up with everything nobody wanted to put somewhere specific. A logger, a date formatter, a weirdly specific component that only one feature uses — it all ends up in shared because it was the path of least resistance.

The rule that keeps it clean: something belongs in `shared/` only if it is genuinely used by three or more features, or if it represents a system-wide concern (logging, error handling, HTTP client) that no single feature should own.

One feature needing a utility? That utility lives in that feature's folder.

---

## What this is really about

The way you organise code is not an aesthetic choice. It is a statement about how your team works and what you value.

File-type organisation values type consistency. Every component is with every other component. Clear category.

Vertical slice organisation values ownership. Every thing related to a feature is with that feature. Clear accountability.

At small scale both work. At medium scale the file-type approach produces merge conflicts, unclear ownership, and "where does this go?" conversations every sprint. At large scale it produces codebases where nobody can confidently say what code belongs to what feature, and changing one thing secretly breaks another.

Vertical slices scale with the team. Each feature is a zone. The zone has an owner or a team. Changes to that zone rarely conflict with other zones. Onboarding is simple: "here is your zone."

**The engineering principle:** Organise code by business domain, not by file type. Each domain owns its components, hooks, types, and tests. Cross-cutting concerns go in a shared kernel with a strict rule about what belongs there. Features never import from other features.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/001-use-vertical-slices">ADR 001 — Vertical Slice Architecture</a></li>
<li><a href="../interview/react-architecture">Interview: How would you structure a large React codebase?</a></li>
<li><a href="../interview/behavioural">Interview: How do you approach an unfamiliar codebase?</a></li>
</ul>
</div>
