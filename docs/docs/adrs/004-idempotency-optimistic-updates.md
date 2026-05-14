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

## Consequences

- Frontend must handle rollback logic carefully; snapshot integrity is critical.
- Backend must store idempotency keys with a TTL.
