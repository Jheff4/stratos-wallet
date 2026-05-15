# 005: Real‑Time Communication Strategy

- **Date**: 2026-05-15
- **Status**: accepted

## Context

The transaction feed and balances need live updates. Future features include trade orders (bidirectional).

## Decision

Use **WebSocket** as the primary real‑time channel, with a custom `useWebSocket` hook that handles reconnection, heartbeats, and message parsing. New transactions are merged into the infinite query cache via `queryClient.setQueriesData`.

## Alternatives Considered

- **SSE**: Simpler for one‑way streams, but lacks native binary support and bidirectional capability. Could be added for market data later.
- **GraphQL Subscriptions**: More aligned with our GraphQL schema, but require a full GraphQL server and `graphql-ws` client. Our current approach is backend‑agnostic and simpler to mock.

## Consequences

- Need to maintain a small WebSocket server for development.
- Cache merging logic must handle multiple active filters gracefully; we used query key pattern matching.
