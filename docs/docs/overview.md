# Project Overview

## What Stratos Wallet is

**Stratos Wallet** is a frontend-heavy fintech application engineered to the standard expected at senior and staff level. It is not a tutorial project or a CRUD demo. Every architectural decision — folder structure, data model, real-time protocol, cache strategy — was made deliberately and documented.

The application simulates a personal finance dashboard with live transaction feeds, balance history, fund transfers, spending analytics, and a full resilience simulation layer.

---

## What it is designed to demonstrate

### System design judgment

The application can be explained top-down: why vertical slices instead of file-type folders, why a ledger instead of a stored balance, why WebSocket instead of polling, why React Query instead of a custom store. Each decision has a documented alternative, a documented tradeoff, and a reason the alternative was not chosen.

This is the difference between building something that works and being able to defend it in a system design interview.

### Failure-first engineering

Every real-time subsystem is built assuming failure. The WebSocket hook handles duplicate delivery, dropped messages, and missed events after reconnection. GraphQL handlers simulate latency, partial failures, and timeouts via a chaos system with 15+ presets.

The chaos system is not a separate testing tool. It is a first-class development tool used while building every feature.

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
| React Query v5 | Server state management, caching, mutations |
| GraphQL + Codegen | API contract, generated typed hooks |
| MSW v2 | Mock service worker — intercepts GraphQL and REST at the network layer |
| Zustand | Global client state (session, theme) |
| Recharts | Balance history and spending charts |
| Vitest | Unit and integration tests |
| WebSocket | Real-time transaction feed with reliability protocol |

---

## Running the project

```bash
# Install dependencies
pnpm install

# Start the WebSocket server (real-time events)
cd server && pnpm dev

# Start the application
pnpm dev
```

The application runs at `http://localhost:5173`.
The WebSocket server runs at `ws://localhost:8080`.
The docs run at `http://localhost:3000` from the `docs/` directory.

Default credentials:

```
Email:    admin@stratos.com
Password: admin123
```

Register a new account to see the dynamic wallet creation flow and confirm balance history works for non-seed users.

---

## Project maturity by phase

| Phase | Status | Notes |
|---|---|---|
| Foundation & Architecture | ✅ Complete | Vertical slices, shared kernel, contract-first |
| Domain Modeling | ✅ Complete | Ledger-first, single wallet store, `computeBalance` |
| State Management | 🔄 In progress | React Query configured; optimistic mutations in transfers |
| Real-Time Systems | ✅ Core complete | seq, dedup, replay, connection status |
| Resilience Engineering | 🔄 In progress | Chaos system complete; error boundary hierarchy in progress |
| Observability | 🔄 In progress | `createLogger` complete; trace propagation through React Query pending |
| Accessibility & UX | ⏳ Planned | Skeletons exist; ARIA and keyboard nav pending |
| Testing & Production | ⏳ Planned | Test directories created; implementation pending |
