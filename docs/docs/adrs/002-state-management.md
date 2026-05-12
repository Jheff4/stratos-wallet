# 002: State Management Strategy

- **Date**: 2026-05-11
- **Status**: accepted

## Context

We need a state management approach that balances simplicity and scalability.

## Decision

Use Zustand for global client state (user, theme) and feature-scoped hooks for domain data. We will introduce React Query for server state synchronization when we adopt a real API.

## Alternatives Considered

- **Redux Toolkit**: Offers strong conventions, but adds boilerplate. We can migrate if the team grows and needs strict structure.
- **Context API**: Fine for small-scale, but performance issues with frequent updates. We’ll use it sparingly.

## Consequences

- Simple mental model: hooks for features, Zustand for cross-cutting concerns.
- Easy to onboard new developers.
- React Query integration will be straightforward.
