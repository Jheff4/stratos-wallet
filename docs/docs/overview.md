# Project Overview

## What Stratos Wallet is

**Stratos Wallet** is a frontend-heavy fintech application engineered to the standard expected at senior and staff level. It is not a tutorial project or a CRUD demo. Every architectural decision (folder structure, data model, real-time protocol, cache strategy) was made deliberately and documented.

The application is a personal finance dashboard with live transaction feeds, balance history, fund transfers, spending analytics, a real-time activity feed, and a full resilience simulation layer.

---

## Pages

| Page | What it does |
|---|---|
| **Dashboard** | Balance trend chart (area), portfolio allocation (donut), spending by category (bar). All data derived from the ledger. |
| **Wallets** | Create and list wallets. Creation invalidates the cache and refreshes the list immediately. |
| **Accounts** | Live balances across all accounts. Stat cards for total balance, account count, and currencies. Hover prefetches transactions. |
| **Transactions** | Infinite scroll feed with real-time prepend. Filterable by account via `?accountId=` URL param. Color-coded type badges. |
| **Transfers** | Optimistic transfer with idempotency key. Shows preview before submit, spinner during processing, full success summary on completion. Rollback on failure. |
| **Activity** | Live WebSocket event stream. Shows seq number, event type, replayed-event badges, amounts, and receive time. |
| **Settings** | Profile, preferences, security stubs. |

---

## What it is designed to demonstrate

### System design judgment

The application can be explained top-down: why vertical slices instead of file-type folders, why a ledger instead of a stored balance, why WebSocket instead of polling, why React Query instead of a custom store. Each decision has a documented alternative, a documented tradeoff, and a reason the alternative was not chosen.

This is the difference between building something that works and being able to defend it in a system design interview.

### Failure-first engineering

Every real-time subsystem is built assuming failure. The WebSocket hook handles duplicate delivery, dropped messages, and missed events after reconnection. GraphQL handlers simulate latency, partial failures, and timeouts via a chaos system with 15+ presets.

The chaos system is not a separate testing tool. It is a first-class development tool: toggle it from the sidebar without leaving the page you are testing.

### Frontend architecture at scale

- **Vertical slices** enforce feature ownership and prevent cross-feature coupling.
- **Contract-first development** means the GraphQL schema defines the interface; components implement against the contract, not against an ad-hoc API.
- **Ledger-first data model** means every balance is provable, every historical state is reconstructable, and new analytics features require no data migration.

---

## Tech stack

| Tool | Role |
|---|---|
| React 19 | UI framework |
| TypeScript (strict) | Type safety throughout |
| Vite | Build tool and dev server |
| React Query v5 | Server state management, caching, optimistic mutations |
| GraphQL + Codegen | API contract, generated typed hooks |
| MSW v2 | Mock service worker: intercepts GraphQL and REST at the network layer |
| Zustand | Global client state: WS status, notifications, chaos panel open/close |
| Recharts | Balance trend, portfolio allocation, spending charts |
| WebSocket | Real-time transaction feed with seq, dedup, replay reliability protocol |
| Vitest | Unit and integration tests |

---

## Running the project

```bash
# Install dependencies
npm install

# Start the WebSocket server (real-time events)
cd server && pnpm dev

# Start the application (separate terminal)
npm run dev
```

The app runs at `http://localhost:5173`.  
The WebSocket server runs at `ws://localhost:8080`.  
The docs run at `http://localhost:3000` (from the `docs/` directory).

---

## Project maturity by phase

| Phase | Status | Notes |
|---|---|---|
| Foundation & Architecture | ✅ Complete | Vertical slices, shared kernel, contract-first |
| Domain Modeling | ✅ Complete | Ledger-first, single wallet store, `computeBalance` |
| State Management | ✅ Complete | React Query + Zustand; optimistic mutations with rollback |
| Real-Time Systems | ✅ Complete | seq, dedup, replay, activity feed, toast notifications, connection status |
| Resilience Engineering | ✅ Complete | Chaos system, error boundaries, human-readable error states, retry |
| Observability | 🔄 In progress | `createLogger` complete; trace propagation through React Query pending |
| Accessibility & UX | 🔄 In progress | Skeletons, responsive layout; ARIA and keyboard nav pending |
| Testing & Production | ⏳ Planned | Test directories created; implementation pending |
