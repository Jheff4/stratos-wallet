# Transfers Feature

## Purpose

Allow users to move money between accounts within a wallet.

## Key Behaviors

- **Idempotency**: Every transfer generates a unique idempotency key (`crypto.randomUUID()`) to prevent duplicate transfers on retries or double-clicks.
- **Optimistic Updates**: Balances update instantly in the UI, then synchronise with the server. On failure, the UI rolls back to the previous state.
- **Cache Management**: After a successful transfer, related caches (`Accounts`, `Wallets`) are invalidated so all views stay consistent.

## Components

- `TransferPage` – Main form for selecting source/destination accounts and amount.

## Public API

- `useTransferFundsMutation()` from GraphQL generated hooks.

## State

- Uses React Query mutation with manual cache updates. No global state needed.
