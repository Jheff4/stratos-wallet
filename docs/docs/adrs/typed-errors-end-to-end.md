# Typed Errors End-to-End

## Context

Data-fetching errors enter the app from many places — GraphQL responses, network failures, third-party SDKs (Paystack, Mono, Dojah). The `typescript-react-query` codegen plugin types `useXQuery().error` as `unknown` by default, because it cannot know what a given endpoint throws.

`unknown` is correct but unergonomic, and in this codebase it caused a concrete defect: in a JSX truthiness expression, `unknown && <Component/>` evaluates to `unknown`, which is not a valid `ReactNode`. A single loosely-typed error field produced a compile error that TypeScript reported at the *wrong line* (the first child of the enclosing fragment), and which a developer could only "fix" with an unsafe `as Error` cast at every call site.

We also compile under `"strict": true`, whose `useUnknownInCatchVariables` makes `catch` bindings `unknown` — reinforcing that error shape must be *proven*, not assumed.

## Decision

Type errors **end-to-end**, in two coordinated places:

1. **Declare at the generator.** Set `errorType: 'Error'` in `codegen.ts`. Every generated query and mutation hook is typed `TError = Error`, across all current and future features, from one line.
2. **Guarantee at the boundary.** The GraphQL fetcher normalizes every failure path to `throw new Error(...)` (HTTP non-2xx, GraphQL `errors`, network failure). This makes the declared type runtime-true rather than a hopeful label.

For thrown values we genuinely cannot control (error boundaries, which can catch anything), keep the type as `unknown` and narrow once at a single choke point:

```ts
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
```

## Alternatives Considered

- **`error as Error` at each call site.** Rejected. A type assertion disables checking without runtime proof; it hides the bug, scales linearly with call sites, and silently breaks rendering when a cast is forgotten.
- **Leave errors as `unknown` and narrow everywhere.** Correct but high-friction for the common case where the fetcher already guarantees `Error`. Reserve `unknown` for genuinely uncontrolled boundaries (error boundary fallbacks).
- **A custom error class (e.g. `AppError`).** Deferred. Worth revisiting when integrations need to carry structured fields (provider, retryable, code). `Error` is the right floor today.

## Consequences

- Error handling is type-safe across every feature with zero per-call ceremony; new integrations inherit it.
- The type is backed by runtime reality because the fetcher normalizes throws — the declaration isn't a lie.
- Error boundaries still receive `unknown` and narrow explicitly, which is correct: a render error can be anything.
- If a future integration throws richer error objects, upgrading `errorType` to a custom class is again a one-line, one-place change.

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/the-error-at-the-wrong-line">The Error at the Wrong Line — debugging the unknown poison</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/react-architecture">React Architecture Questions — typing errors from hooks</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="./api-technology">API Technology Choice</a></li>
</ul>
</div>
