---
sidebar_position: 1
sidebar_label: "Overview"
---

# Interview Preparation

This section is specifically for interview preparation. It assumes you have read and understood the rest of the documentation. The goal here is to take that understanding and translate it into confident, precise answers — the kind that make interviewers lean forward.

---

## How to use this section

Each page contains questions organised by what level of answer is expected. Three levels:

- <span class="diff diff--mid">Mid</span> — the correct answer, clean and clear. A senior candidate who doesn't know this raises flags.
- <span class="diff diff--senior">Senior</span> — the expected answer at Stripe, Coinbase, Ramp, Shopify. Demonstrates judgment, not just knowledge.
- <span class="diff diff--staff">Staff</span> — the answer that ends the interview early because the interviewer knows they're talking to someone who has thought deeply about the space. Surfaces tradeoffs, failure modes, and evolution paths.

---

## What companies are actually evaluating

When Stripe, Coinbase, or Meta interviews a senior/staff frontend engineer, they are not testing whether you know React hooks. They are evaluating:

**System design judgment** — Can you reason about how a system fails, not just how it works? Can you explain why one architectural choice is better than another, under what conditions, and when you'd choose differently?

**Depth over breadth** — Can you go three levels deep on any decision you've made? "I used React Query" is a start. "I chose React Query over Apollo because our backend is GraphQL but we needed more granular cache invalidation control than Apollo's normalized cache provides, and we were already using server state patterns that mapped directly to React Query's model" is what they're listening for.

**Production thinking** — Do you think about edge cases, failure modes, and at-scale behaviour before you're asked? Do your answers include "and here's what I'd do when this breaks" without being prompted?

**Communication** — Can you explain complex engineering decisions clearly to a product manager, to a junior engineer, and to a staff engineer — adjusting depth and vocabulary for each?

This section helps you practice all four.

---

## Pages in this section

| Page | What it covers |
|---|---|
| [System Design](./system-design) | "Design a real-time balance system." Full worked answers. |
| [Data & State](./data-and-state) | Ledger model, React Query, cache strategy, event sourcing |
| [Real-Time Systems](./real-time) | WebSocket protocol, deduplication, sequence numbers, backoff |
| [React Architecture](./react-architecture) | Vertical slices, component design, performance, accessibility |
| [Behavioural](./behavioural) | "Tell me about a hard technical decision." Story-based answers. |

---

## Before your next interview

Three things to do:

1. **Run the app under every chaos preset.** Watch what happens. Be able to describe exactly what fails, how the UI reacts, and how it recovers. This is your live demo of resilience engineering.

2. **Read the ADRs out loud.** Every decision you made should roll off your tongue. Context → decision → alternatives → tradeoffs → consequences. That structure in your answers signals engineering maturity.

3. **Know your "why did you choose X over Y" for every major tool.** React Query over Apollo. WebSocket over SSE. Ledger over stored balance. Vertical slices over file-type organisation. You should be able to answer each one in 30 seconds and defend it for 5 minutes.
