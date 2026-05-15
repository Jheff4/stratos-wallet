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
