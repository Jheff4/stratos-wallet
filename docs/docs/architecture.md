# Architecture

## Project Structure

We use **vertical slices** (feature folders). Each feature owns its components, hooks, API, and tests.

- `src/features/` — business domains
- `src/shared/` — cross-cutting utilities
- `src/app/` — application shell, routing, global store

[Read our ADRs for decisions](/adrs/use-vertical-slices)
