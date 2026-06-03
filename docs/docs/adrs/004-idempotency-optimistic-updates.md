# 004: Idempotency and Optimistic Updates for Financial Mutations

- **Date**: 2026-05-14
- **Status**: accepted

## Context

Financial operations like transfers must never be duplicated and should provide instant feedback to users.

## Decision

- **Client-generated idempotency key** (`crypto.randomUUID()`) sent with every `transferFunds` mutation.
- **Optimistic update pattern** using React Query’s `onMutate`, `onError`, `onSettled`.
- **Retry disabled** for mutations (`retry: false`) – network failures require explicit user retry, not automatic ones.

## Alternatives Considered

- Server-generated idempotency keys – adds a round-trip, not suitable for instant feedback.
- Apollo Client’s optimistic response – tightly coupled to GraphQL; React Query’s approach is backend-agnostic and gives explicit cache control.

## Optimistic update lifecycle

```mermaid
sequenceDiagram
  participant U as User
  participant UI as React UI
  participant RQ as React Query Cache
  participant API as GraphQL API

  U->>UI: taps "Transfer ₦75,000"
  UI->>RQ: cancelQueries(['accounts'])
  RQ-->>UI: snapshot saved
  UI->>RQ: setQueryData → balance –₦75,000 (optimistic)
  UI-->>U: balance updates instantly ✓

  UI->>API: transferFunds mutation
  Note over UI,API: request in flight (user sees new balance)

  alt success
    API-->>UI: { success: true }
    UI->>RQ: invalidateQueries(['accounts'])
    RQ->>API: refetch → authoritative balance
    RQ-->>UI: confirmed balance
  else error
    API-->>UI: { error: "Insufficient funds" }
    UI->>RQ: setQueryData ← restore snapshot
    UI-->>U: balance reverts + error toast
    UI->>RQ: invalidateQueries(['accounts'])
  end
```

<p class="diagram-caption">Optimistic updates give instant feedback. The snapshot ensures rollback is always available. <code>onSettled</code> always refetches — the server's answer is the final truth.</p>

## Consequences

- Frontend must handle rollback logic carefully; snapshot integrity is critical.
- Backend must store idempotency keys with a TTL.

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/sams-double-transfer">Sam's Double Transfer — idempotency keys</a></li>
<li><a href="../stories/the-optimistic-chef">The Optimistic Chef — optimistic updates & rollback</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/system-design">System Design — handling duplicate submissions</a></li>
<li><a href="../interview/react-architecture">React Architecture — optimistic updates failure modes</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related ADRs</h4>
<ul>
<li><a href="./008-ledger-first-data-model">ADR 008 — Ledger-First Data Model</a></li>
<li><a href="./006-failure-system">ADR 006 — Failure Simulation & Resilience</a></li>
</ul>
</div>
