---
sidebar_label: "Type Safety"
---

# Quiz — Type Safety

Covers strict mode, `unknown` error handling, and fixing types at the codegen layer. See [Architecture → Type Safety](../architecture#type-safety) for the reference material.

---

## Question 1 — `strictNullChecks`

<span class="diff diff--mid">Mid</span>

<div class="interview-q">What category of runtime bug does <code>strictNullChecks</code> eliminate, and why is that category especially dangerous in a balance or transfer flow specifically?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

It eliminates **"accessing a property/method on `null` or `undefined`"** bugs — the `Cannot read properties of undefined` class.

Without `strictNullChecks`, `null` and `undefined` are members of every type. So a not-yet-loaded account is typed `Account` even when it's actually `undefined`, and `account.balance.toFixed(2)` compiles clean — then throws at runtime.

It's especially dangerous in a money flow because the failure lands **on the exact surfaces users trust most**: a balance display, a transfer confirmation. A blank or crashed balance view erodes trust faster than almost any other bug. Strict mode converts "runtime crash in front of a user" into "compile error the developer must handle" — which forces you to write the loading/empty/error states the UI needed anyway.

</div>
</details>

---

## Question 2 — Why `unknown` for caught errors

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Our error boundary types its <code>error</code> prop as <code>unknown</code> instead of <code>Error</code>. Why is that more correct, and what's the one-line pattern that makes <code>unknown</code> safe to use?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Because in JavaScript you can `throw` **anything** — a string, a plain object, `undefined`, not just an `Error`. Typing the prop as `Error` is a lie the compiler can't catch; the day a library throws a string, `error.message` is `undefined` and the error UI itself crashes. (`strict` mode encodes this reality in `catch` clauses too, via `useUnknownInCatchVariables`.)

The pattern is to **narrow once at a single choke point**:

```ts
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
```

After that one line, everything downstream works with a guaranteed `string`. You prove the shape once instead of assuming it everywhere.

</div>
</details>

---

## Question 3 — Fixing types at the source

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Our GraphQL hooks used to type <code>.error</code> as <code>unknown</code>. Beyond forcing <code>as Error</code> casts, what subtle rendering bug did that cause in JSX — and why was the fix one line in <code>codegen.ts</code> rather than edits across every feature?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

**The subtle bug:** `unknown` poisons JSX truthiness expressions. `{error && <ErrorCard/>}` evaluates to type `unknown` when `error` is `unknown` — and `unknown` is not a valid `ReactNode`. So a single loosely-typed error field caused a compile error that TypeScript even *reports at the wrong line* (the first child of the enclosing fragment), sending you hunting in the wrong place.

**Why one line:** the hooks are generated. The error type came from the `typescript-react-query` plugin's default (`TError = unknown`). Setting `errorType: 'Error'` in `codegen.ts` regenerates every query and mutation hook with `TError = Error` — so the fix lands across all current and future features at once. Editing each call site would patch symptoms and drift; fixing the generator fixes the contract.

This is the staff-level instinct: **when a type problem repeats across features, change the thing that produces the types, not the consumers.**

</div>
</details>

---

## Question 4 — The half that makes the type true

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Setting <code>errorType: 'Error'</code> tells TypeScript every hook's error is an <code>Error</code>. But TypeScript can't actually verify that. What second change makes the declaration true rather than a hopeful label — and why does a call-site <code>as Error</code> cast have neither half?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

The second half is **normalizing throws at the fetcher boundary**. The GraphQL fetcher makes every failure path throw a real `Error`:

```ts
if (!res.ok)     throw new Error(`GraphQL request failed: HTTP ${res.status}`);
if (json.errors) throw new Error(json.errors[0].message);
```

Now the declared type (`Error`) and the runtime value (`new Error(...)`) agree. The type isn't a wish — the boundary enforces it.

A call-site `as Error` cast has **neither** half:
- It doesn't declare anything reusable — it's local to one expression, repeated by hand everywhere.
- It doesn't guarantee anything at runtime — `as` is an assertion the compiler trusts blindly. If the real value isn't an `Error`, the cast still compiles and fails at runtime.

The full pattern is **declare at the generator + guarantee at the boundary**. That's what "type-safe" actually means: the type and the runtime can't disagree.

</div>
</details>

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
<li><a href="../adrs/typed-errors-end-to-end">Typed Errors End-to-End</a></li>
</ul>
</div>
