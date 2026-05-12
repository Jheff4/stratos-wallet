# Accounts Feature

## Purpose

Manage user bank accounts, display balances, and summaries.

## Components

- `AccountListPage`: full list of accounts with balances.
- `AccountSummary`: widget showing total balance and per-account breakdown.

## Public API

- `useAccounts()` hook: returns `{ accounts, isLoading, error }`.

## State

Uses local feature-scoped hook with `fetchAccounts` from `api/accountsApi`. Not stored in global state (accounts are server data that will be moved to React Query later).
