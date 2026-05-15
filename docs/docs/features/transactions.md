# Transactions Feature

## Purpose

Display a paginated, infinite-scroll transaction history.

## Pagination

Cursor-based pagination is used to prevent duplicates when new transactions arrive in real-time. The feed supports `first` and `after` parameters.

## Components

- `TransactionHistoryPage` – Main feed with infinite scroll.

## Public API

- `useInfiniteTransactionQuery` – Auto-generated infinite query hook.

## State

React Query’s `useInfiniteQuery` manages pages, caching, and fetching. Cursor is passed via page parameters.

## Prefetching

Transactions for a specific account are prefetched on hover using `queryClient.prefetchInfiniteQuery`. This eliminates loading delay when navigating to the transaction page.

## Real‑time Updates

New transactions are pushed via WebSocket (`ws://localhost:8080`). The `useTransactionSubscription` hook merges them into the React Query cache without refetching, keeping pagination intact.

## Architecture Decision

We chose WebSocket for bidirectional capability (future trading features) over SSE. See ADR‑005.
