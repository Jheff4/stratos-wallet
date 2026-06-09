---
sidebar_label: "React Architecture"
---

# React Architecture Questions

---

## How would you structure a large React codebase?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">You're joining a team that has a large React application organised by file type — all components in /components, all hooks in /hooks. How would you approach migrating to a better structure?</div>

<div class="interview-a">

I'd migrate to vertical slices — organising by business domain rather than file type.

The core problem with file-type organisation at scale: understanding any feature requires navigating multiple directories. Making a change to the transfer feature touches `components/`, `hooks/`, `types/`, and `tests/` — four separate trees. Two engineers working on different features end up in the same directories and produce merge conflicts on files that have nothing to do with each other.

The target structure:

```
features/
  transfers/
    TransferPage.tsx
    hooks/useTransfer.ts
    types.ts
    __tests__/
  accounts/
  wallets/
shared/       ← genuinely cross-cutting concerns only
  api/
  logger.ts
  components/ErrorBoundary.tsx
```

**The migration approach:**

Don't do it all at once. Identify the next feature you need to build or significantly change and create its slice. Over 2–3 sprints, the active features migrate naturally. Legacy features can coexist in the old structure — they're not causing problems because they're not being actively changed.

The hardest part is deciding what belongs in `shared/`. The rule I use: something belongs in `shared/` only if it's used by three or more feature slices, or if it represents a system-wide concern (logging, HTTP client, error handling). One feature needing a utility? That utility lives in that feature's folder.

</div>

---

## When would you use `useMemo` and `useCallback`?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">When do you reach for useMemo and useCallback, and when are they unnecessary?</div>

<div class="interview-a">

The rule: **measure first, memoize second.** React DevTools Profiler tells you which renders are expensive. Don't add memoization until you have data that shows it's needed.

**`useMemo` is valuable when:**
- A computation is genuinely expensive (sorting, filtering, aggregating thousands of items)
- The result is used as a dependency by `useEffect` or another `useMemo` — referential stability prevents unnecessary re-runs
- A large object/array is passed to a heavily optimised child component wrapped in `React.memo`

**`useCallback` is valuable when:**
- A function is passed as a prop to a `React.memo`-wrapped child
- A function is used as a dependency in a `useEffect` and its identity needs to be stable

**When they're not valuable (and add noise):**
- Primitive computations: `const doubled = count * 2` — memoizing this costs more than computing it
- Functions that are only used in the same component and not passed anywhere — the memo overhead exceeds the computation
- Components that re-render infrequently anyway

**The costly misuse:**

The most common mistake is wrapping everything in `useCallback` "just to be safe." Every `useCallback` adds a dependency array comparison on every render. If the function is cheap and never passed to a child, you've added overhead with no benefit.

The framing: `useMemo` and `useCallback` are *performance tools*, not *code quality tools*. Use them when you have a measured performance problem, not as a default.

</div>

<div class="tip">Interviewers at Meta and Netflix will sometimes ask about React's concurrent rendering model and whether memoization strategies change under it. The answer: React 18's concurrent features (Transitions, Suspense) reduce the need for aggressive memoization in some cases, but don't eliminate it. The principle — measure before optimising — becomes more true, not less.</div>

---

## How do you approach accessibility in a React application?

<span class="diff diff--senior">Senior</span>

<div class="interview-q">How do you ensure a complex fintech UI is accessible? What's your process?</div>

<div class="interview-a">

I treat accessibility as a correctness requirement, not a post-launch audit item. Retrofitting accessibility is much more expensive than building it in.

**Semantic HTML first.**

The single highest-ROI accessibility decision: use `<button>` for buttons, `<nav>` for navigation, `<main>` for the main content area, `<table>` for tabular data. Screen readers have rich built-in support for semantic elements. `<div onClick>` works visually but is invisible to assistive technology.

**Keyboard navigation.**

Every interactive element must be reachable and operable via keyboard alone. Tab/Shift+Tab move focus. Enter/Space activate buttons. Escape closes modals. Focus must not disappear into the void — when a modal opens, focus should move into it; when it closes, focus should return to the trigger.

**ARIA live regions for real-time updates.**

This is the one that most teams miss. When the balance updates from a WebSocket event, sighted users see it change. Screen reader users hear nothing — the DOM updated silently.

```tsx
<span
  aria-live="polite"
  aria-atomic="true"
>
  {formatCurrency(balance)}
</span>
```

`aria-live="polite"` announces the new value after the user finishes what they're doing. `aria-atomic="true"` reads the entire span, not just the changed portion. For a balance update, you want to hear "Balance: $1,234.56", not just "234.56".

**My process:**

1. Build with semantic HTML from the start
2. Test keyboard-only before shipping any feature — if you can't complete the flow without a mouse, it's not done
3. Run Axe (browser extension) and fix all violations before PR
4. Test with a screen reader (VoiceOver on macOS, NVDA on Windows) for any new interactive flows
5. Accessibility errors in CI via `jest-axe` for component tests

</div>

---

## Explain optimistic updates and when they can go wrong

<span class="diff diff--senior">Senior</span>

<div class="interview-q">What's the optimistic update pattern, and what are the failure modes you need to handle?</div>

<div class="interview-a">

Optimistic updates apply the expected result of a mutation to the UI immediately, before the server confirms, then correct if the server disagrees.

The three-phase React Query pattern:

```ts
useMutation({
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['accounts'] }); // stop stale data overwriting us
    const snapshot = queryClient.getQueryData(['accounts']);      // save for rollback
    queryClient.setQueryData(['accounts'], applyExpectedChange(old, variables)); // act now
    return { snapshot };
  },
  onError: (_err, _vars, context) => {
    queryClient.setQueryData(['accounts'], context.snapshot);    // undo
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['accounts'] });   // get truth from server
  },
});
```

**Failure mode 1 — The partial update.**

You forget to call `cancelQueries` before the optimistic update. An in-flight background refetch resolves after the optimistic update and overwrites it with stale server data. The user sees the balance flicker back to the pre-transfer value, then forward again when the post-transfer refetch completes. Disorienting.

**Failure mode 2 — The rollback that's wrong.**

The server returns an error but the mutation actually succeeded (the error was in the response serialisation, not the operation). You roll back to pre-transfer state, but the transfer already processed. The user has incorrect data and doesn't know it.

This is why `onSettled` always invalidates — you don't trust the optimistic value or the rollback state. You always ask the server for the truth on settle.

**Failure mode 3 — Optimistic state leaking across navigation.**

A user starts a transfer, navigates away before it resolves, and comes back. If the component that held the snapshot has unmounted, the rollback can't run because there's nothing to roll back to. React Query handles this if cache keys are stable — the snapshot is in the query cache, not component state, so it survives unmount.

</div>

---

## How do you type errors from data-fetching hooks?

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Your generated query hooks type <code>.error</code> as <code>unknown</code> by default. A teammate fixes the resulting compile errors by writing <code>error as Error</code> at each call site. Why is that the wrong fix, and what would you do instead?</div>

<div class="interview-a">

`error as Error` is a **type assertion, not a check** — it switches the compiler off without any runtime proof. The day something throws a non-`Error` (a GraphQL error array, a string from a third-party SDK), the cast still compiles and `.message` is `undefined` at runtime. It hides the bug instead of fixing it. It also doesn't scale: every new hook needs the developer to *remember* the cast, and a forgotten one silently breaks rendering — `unknown && <ErrorCard/>` evaluates to `unknown`, which is not a valid `ReactNode`.

I'd fix it in two coordinated places — the two halves of an honest guarantee:

1. **Declare the type at the generator.** The hooks are generated, so I set `errorType: 'Error'` in `codegen.ts`. Every current and future hook is typed `TError = Error` from one line — new integrations (Paystack, Mono, Dojah) inherit it automatically.
2. **Guarantee it at the fetcher boundary.** Declaring `Error` is a claim the type system can't verify on its own, so the fetcher must *make it true*: every failure path throws `new Error(...)`. Now the type and the runtime agree.

The principle: when the same type problem repeats across many generated call sites, fix the generator and the boundary that produces the values — not each consumer. A cast has neither half; it just relocates the risk to runtime.

</div>

<div class="stratos-related">
<h4>Related in this project</h4>
<ul>
<li><a href="../adrs/vertical-slice-architecture">Vertical Slice Architecture</a></li>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
<li><a href="../stories/nates-messy-flat">Story: Nate's Messy Flat</a></li>
<li><a href="../stories/the-optimistic-chef">Story: The Optimistic Chef</a></li>
</ul>
</div>
