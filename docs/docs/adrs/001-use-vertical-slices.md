# ADR 001 — Vertical Slice Architecture

<span class="stratos-status stratos-status--accepted">Accepted</span> · 2026-05-11

---

## Context

As Stratos Wallet grows across multiple business domains — authentication, wallet management, transfers, transaction history, notifications, admin — we need a code organisation strategy that:

- Keeps related code close together rather than scattered across the project
- Makes it clear who owns what, both for individual developers and for teams
- Allows a feature to be understood, tested, or deleted without reading the whole codebase
- Does not produce merge conflicts when two engineers work on separate features simultaneously

The default alternative — organising by file type — puts all components together, all hooks together, and all types together. This is intuitive for small projects and increasingly painful for large ones.

---

## Decision

Organise source code by **feature (vertical slice)**, not by file type. Each feature folder contains every concern for that domain.

```
src/features/
  auth/
    LoginPage.tsx
    api/
    hooks/
    components/
    types.ts
    __tests__/
  transfers/
    TransferPage.tsx
    transfers.graphql
    hooks/
    types.ts
    __tests__/
  wallets/
  accounts/
  transactions/
  dashboard/
```

Cross-cutting concerns that no single feature owns live in `src/shared/`. **Features never import from other features.**

---

## Rationale

### The file-type organisation problem, illustrated

Consider what happens when a junior engineer asks: "where is the transfer feature?"

With file-type organisation, the answer is: "the component is in `src/components/TransferForm.tsx`, the hook is in `src/hooks/useTransfer.ts`, the types are in `src/types/transfer.ts`, and the tests are in `src/__tests__/transfer.test.tsx`." Four different locations. No single folder tells the whole story.

With vertical slices, the answer is: "`src/features/transfers/`."

### The merge conflict problem

When two engineers work on separate features with file-type organisation, they both edit `src/components/`, `src/hooks/`, and `src/types/`. Git sees these as the same directories and produces conflicts even when the actual changes are unrelated.

With vertical slices, engineer A touches `features/transfers/` and engineer B touches `features/wallets/`. They do not conflict.

### The deletion problem

Removing a feature from a file-type-organised project requires knowing which components, hooks, and types belong to that feature — information that is not encoded in the directory structure. With vertical slices, deleting a feature is deleting a folder.

---

## Alternatives Considered

### File-type organisation

```
src/components/
src/hooks/
src/types/
src/utils/
```

**Why rejected:** Does not scale. At 20+ components, nothing about the directory structure reveals which components are related. Cross-feature changes require touching multiple top-level directories.

### Domain-driven design with bounded contexts

A stricter form of vertical slices where each context is treated as an isolated module with its own service layer and no shared data structures at all.

**Why not chosen now:** Appropriate when features have fundamentally different data models and cannot share types. Stratos Wallet features share `LedgerEntry`, `WalletDef`, and `AccountDef` across several slices. Full bounded contexts would require duplicating these definitions.

**When to revisit:** If the admin feature or the trading feature grows large enough to have its own specialised data model, that slice could be promoted to a bounded context.

### Feature flags without folder separation

Keeping all code in a flat structure but using feature flags to control what renders.

**Why rejected:** Feature flags solve *deployment* isolation, not *code* isolation. You still need to find and understand all the code for a feature, which is the problem being solved.

---

## Consequences

**Positive:**
- A new engineer can read one folder to understand one feature.
- Deleting or disabling a feature means removing one folder.
- Feature ownership is structurally enforced, not just conventional.
- Merge conflicts between independent features are eliminated.

**Negative:**
- Requires discipline to keep `shared/` from becoming a dumping ground. Any utility that is not genuinely cross-cutting should live in the feature that uses it.
- Requires a clear definition of what belongs in `shared/` vs. a feature. The rule used here: if only one feature needs it, it belongs to that feature.

---

## Interview discussion points

> "How would you organise a large React codebase?"

The answer that separates senior from mid-level is: "I organise by domain, not by file type. Each feature owns its components, hooks, types, and tests. Cross-cutting concerns go in a shared kernel. Features never import from each other."

The follow-up that separates staff from senior: "The real challenge is what goes in the shared kernel. If you're too aggressive, the kernel becomes a grab-bag and you've recreated the file-type problem one level up. The rule is: shared only if it's genuinely used by three or more features, or if it represents a system-wide concern like logging or error handling."

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/nates-messy-flat">Nate's Messy Flat — vertical slices explained</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/react-architecture">React Architecture — structuring a large codebase</a></li>
<li><a href="../interview/behavioural">Behavioural — approaching an unfamiliar codebase</a></li>
</ul>
</div>
