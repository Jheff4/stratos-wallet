# 001: Use Vertical Slice Architecture

- **Date**: 2026-05-11
- **Status**: accepted

## Context

We need a scalable code organization for a large fintech dashboard with multiple domains.

## Decision

We organize code by feature (accounts, transactions, trading), not by file type. Each feature folder contains all related code.

## Consequences

- Better code ownership and team scaling
- Higher cohesion, lower coupling
- Requires discipline to keep feature boundaries clean
