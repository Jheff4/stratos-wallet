# Architecture

## Project Structure

We use **vertical slices** (feature folders). Each feature owns its components, hooks, API, and tests.

- `src/features/` — business domains
- `src/shared/` — cross-cutting utilities
- `src/app/` — application shell, routing, global store

[Read our ADRs for decisions](/adrs/use-vertical-slices)

## State Management

We classify state into three categories:

- **Local UI state** (`useState`, `useReducer`)
- **Feature state** (custom hooks per domain)
- **Global client state** (Zustand store for user preferences, theme)

Server data will be handled by React Query in the future to avoid manual caching and synchronization.

See ADRs for decisions on state libraries.
