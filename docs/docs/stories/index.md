---
sidebar_position: 1
sidebar_label: "About this section"
---

# Engineering Through Stories

The specs explain what we built and why. The ADRs document the decisions and tradeoffs. This section does something different.

Every concept in Stratos Wallet has a story behind it — a real-world scenario where someone got hurt because the engineering was wrong, or where the right design saved everything. These are the scenarios experienced engineers keep in their heads as intuition pumps. They're how the abstract pattern becomes something you actually remember when you're under pressure in an interview or at 2am debugging production.

The characters here are fictional. The failure modes are not.

---

## Data Architecture

*How we store, derive, and protect financial data.*

| Story | What breaks without it |
|---|---|
| [Nate's Missing Thousands](./nates-missing-thousands) | A fee calculation bug. With stored balances, the correct numbers are gone forever. With a ledger, fix the function and recompute. |
| [The Two Filing Cabinets](./two-filing-cabinets) | Two wallet stores drift apart. New users get empty balance history. One store fixes it permanently. |
| [Sam's Invisible Bug](./sams-invisible-bug) | O(n) balance reads. Fine at 20 entries per account, 4-second latency at 5,000. Snapshots are the answer. |

---

## Real-Time Systems

*What happens to your WebSocket when reality intervenes.*

| Story | What breaks without it |
|---|---|
| [Azeez in the Tunnel](./azeez-in-the-tunnel) | 90 seconds offline, 3 missed transactions, wrong balance. Sequence numbers + replay make it invisible to the user. |
| [Jon's Duplicate Feed](./jons-duplicate-feed) | At-least-once delivery means the same event arrives twice. Without deduplication by eventId, the feed shows duplicate transactions. |
| [The Reconnect Storm](./the-reconnect-storm) | 12,000 clients reconnect simultaneously after a server restart. Without backoff + jitter, they crash the server again immediately. |

---

## Mutations & User Experience

*What the user sees while the request is in flight.*

| Story | What breaks without it |
|---|---|
| [Sam's Double Transfer](./sams-double-transfer) | Bad WiFi, double-tap, ₦150,000 sent twice. Idempotency keys make two requests produce one result. |
| [The Optimistic Chef](./the-optimistic-chef) | Transfers that show a spinner for 2 seconds vs ones that update instantly. Optimistic updates, rollback, and the `onSettled` refetch. |

---

## Architecture & Structure

*The decisions that compound over time.*

| Story | What breaks without it |
|---|---|
| [Nate's Messy Flat](./nates-messy-flat) | File-type organisation: to change one feature, touch four directories. Vertical slices: change one folder. |
| [The Error at the Wrong Line](./the-error-at-the-wrong-line) | A compiler error blamed on the wrong line; an `unknown` error type poisons JSX. Fixed at the generator, not with per-call casts. |

---

## Resilience & Tooling

*The fake backend, the failure valve, and the seams between worlds.*

| Story | What breaks without it |
|---|---|
| [The Chaos That Wouldn't Happen](./the-chaos-that-wouldnt-happen) | A chaos toggle that changes nothing — config lives in two execution contexts and silently drifts. One source of truth, pushed across the boundary. |

---

## How these connect to the rest of the docs

Every story ends with a **Go Deeper** section linking to the ADR that governs the pattern, the interview question that tests it, and any related stories. You can navigate forward from a story to the full technical decision, or backward from an ADR to the story that makes it memorable.
