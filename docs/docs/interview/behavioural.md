---
sidebar_label: "Behavioural"
---

# Behavioural Questions

Behavioural questions at senior/staff level are not about "tell me about a time you worked in a team." They are about engineering judgment, technical leadership, and how you navigate ambiguity and tradeoffs. The answers below use Stratos Wallet as the evidence base.

---

## Tell me about a hard architectural decision you made

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Tell me about an architectural decision where you had to choose between two legitimate approaches. How did you decide?</div>

<div class="interview-a">

The most interesting one in Stratos Wallet was the balance storage decision.

The simple approach is to store a `balance` field on the account record and update it on every transaction. It's faster to read, simpler to implement, and how most tutorial apps work.

The principled approach is to never store the balance — derive it from an append-only ledger every time it's needed.

I chose the ledger approach, but not because it's more interesting. I chose it because of a specific failure mode the stored-balance approach can't handle: two-write inconsistency.

A transfer involves two writes: update the balance, write the transaction record. If the server crashes between them, you end up with a balance that disagrees with the transaction history. In a financial application, there is no safe way to recover from this without a full audit. The balance is wrong, the history is wrong, and you can't tell which one is authoritative.

The ledger approach eliminates this class of bug structurally: the balance is computed from the transaction records, so they literally cannot disagree. The cost is O(n) computation per balance read, which requires periodic snapshotting at scale — but that's a performance problem with a known solution, not a correctness problem with no solution.

The decision came down to: which problem would I rather have? A performance challenge I know how to solve, or a consistency bug that could require a regulatory disclosure? The answer was straightforward.

</div>

---

## Tell me about a bug that was hard to find

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Describe a bug that was non-obvious and what it taught you about the system.</div>

<div class="interview-a">

In an earlier version of the wallet code, balance history was returning empty for all users except the original demo user. No error, no exception — just an empty array.

The root cause took a while to find. There were two separate data structures for wallets: a static array (seeded at module initialisation) and a Map (populated at runtime when users registered). `computeBalanceHistory()` searched the static array. New user wallets went into the Map. The two stores never interacted.

The bug was invisible during development because I always tested with the original demo user, whose wallet was in the static array. The first time a colleague registered a new account and checked balance history, it was empty — and there was no error to follow.

What it taught me: the most dangerous bugs are the ones that fail silently for a specific class of inputs. If `computeBalanceHistory()` had thrown when the wallet wasn't found, I would have caught it immediately. Instead it returned `[]` — a valid empty result that looked like correct behaviour for an account with no history.

The fix was structural: remove the static array entirely, seed the Map at startup, and route all wallet access through a single `getWalletById()` function. Making it structurally impossible to have two diverged stores means that class of bug can't happen again — not just in this case, but ever.

</div>

<div class="tip">The strongest version of this answer ends with "and here's what I changed to make this class of bug impossible in the future." That structural fix is what separates a bug report from an engineering insight.</div>

---

## How do you approach an unfamiliar codebase?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">You join a team with a large, unfamiliar frontend codebase. What's your process in the first two weeks?</div>

<div class="interview-a">

**Week 1 — understand the system, not the code.**

I start with the data model, not the components. What are the core entities? How do they relate? Where does state live? A financial app's data model tells me more about the system's complexity than any component tree.

Then I read the ADRs or equivalent decision logs if they exist. I want to understand why the system is the way it is before I form opinions about whether it should be different.

I trace one user action end-to-end: a form submission, a navigation event, a real-time update. What happens at each layer? Where does it enter the frontend, how does it flow through state, what does it render?

**Week 2 — find the seams.**

What are the boundaries between features? Where does state leak across what should be domain boundaries? Where are the implicit dependencies that aren't visible in import statements?

I look for the "everyone knows not to touch this" files — the ones that are imported everywhere, that have grown without a clear owner. These are often where the most debt lives.

**What I don't do:**

I don't start proposing rewrites in week 1. I don't assume the existing decisions were wrong. Most codebases that look messy have reasons behind the mess — constraints, historical context, deliberate tradeoffs that aren't visible without asking. Earn the right to have opinions by understanding the existing decisions first.

By the end of week 2, I want to be able to explain the system's architecture to a new engineer and identify two or three specific, scoped improvements with clear reasoning. Not a rewrite. Scoped improvements.

</div>

---

## How do you balance engineering quality with shipping speed?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Product wants a feature shipped in two weeks. Your estimate is four weeks if done properly. How do you handle this?</div>

<div class="interview-a">

I reframe the conversation. "Done properly" is often ambiguous — it can mean anything from "has tests" to "handles every edge case we'll encounter in three years." The question is not "quality versus speed" but "which quality attributes matter right now and which can be deferred?"

My process:

**Define the non-negotiables.** In a financial application: correctness, security, and idempotency are not negotiable. I won't ship a transfer feature that can double-charge. But I might defer comprehensive test coverage, accessibility polish, and monitoring instrumentation.

**Make the tradeoffs explicit.** "We can ship in two weeks if we defer test coverage and accessibility. The risk is: if there's a bug in the transfer logic, we won't catch it before it reaches users, and fixing it under production pressure is more expensive than doing it right now." I document this.

**Build for replaceability, not perfection.** Two-week implementation doesn't mean cowboy code. It means vertical slices so the feature is self-contained and replaceable. It means idempotency and rollback from day one. It means the correctness properties are solid and the polish is deferred. Code written in two weeks with clean boundaries is much easier to harden later than code written in two weeks that's woven through every other module.

**Follow through on the deferral.** The technical debt is real. I put it in the backlog with a clear description of what was deferred and why, and I advocate for the time to address it in the next sprint. The failure mode is not cutting corners — it's cutting corners and pretending you didn't.

</div>

<div class="stratos-related">
<h4>Related in this project</h4>
<ul>
<li><a href="../stories/two-filing-cabinets">Story: The Two Filing Cabinets</a></li>
<li><a href="../adrs/vertical-slice-architecture">Vertical Slice Architecture</a></li>
<li><a href="../adrs/ledger-first-data-model">Ledger-First Data Model</a></li>
</ul>
</div>
