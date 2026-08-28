---
sidebar_label: "The Error at the Wrong Line"
---

# The Error at the Wrong Line

*Concept: Type inference · `unknown` poisoning · fixing at the source*

---

Tunde had shipped harder things than a transfer form before lunch.

He'd just finished wiring the new transfer screen at the fintech startup where he'd been the second frontend hire. Two account dropdowns, an amount field, an optimistic update. He saved the file and the build went red.

```
TransferPage.tsx(207,9): error TS2322:
  Type 'unknown' is not assignable to type 'ReactNode'.
```

He opened line 207. It was the most innocent line in the file:

```tsx
{accountsLoading && <TransferSkeleton />}
```

`accountsLoading` was a boolean. `<TransferSkeleton />` was a component he'd written that morning. A boolean and a component. Where, in that, was anything `unknown`?

---

He did what any reasonable engineer does: he changed the line the compiler was pointing at.

He swapped the skeleton for a plain `<span>`. Still red. He replaced `accountsLoading` with a literal `true`. Still red. He deleted the whole condition and rendered `accountsLoading` on its own. The compiler held its ground: same error, same line, `unknown`.

That was the moment the bug stopped being annoying and started being interesting. Tunde leaned back. *Every change I make to line 207 does nothing. If editing the line the error names changes nothing, the error is not on that line.*

---

He read down the file, slower this time. A few lines below the skeleton sat the error state:

```tsx
{!accountsLoading && accountsError && (
  <div className="card">Something went wrong…</div>
)}
```

`accountsError` came from the generated GraphQL hook. He hovered it. **`unknown`.** The codegen plugin typed every query's error as `unknown`, because it couldn't know what a given endpoint might throw.

And then the quiet part clicked. In a JSX `&&` chain, the type of the whole expression is whatever flows through it:

```ts
unknown && <div/>   // ⇒ unknown
```

`unknown` is not a valid `ReactNode`. So *that* child of the fragment (the error state, not the skeleton) was the genuinely broken one. TypeScript, when a fragment's list of children contains an incompatible member, reports it at the position of the **first** child. Line 207. The error was real. The address was a lie.

---

The fast fix was sitting right there, and Tunde had typed it a hundred times in his career:

```tsx
const accountsError = error as Error;
```

It would compile. He even started typing it. Then he stopped, because he knew what `as` actually was. It wasn't a check. It was him telling the compiler to stop looking, without a shred of proof. The day a GraphQL endpoint returned an array of error objects, or a payments SDK threw a bare string, `accountsError.message` would be `undefined` at runtime and this cast would have waved it through with a smile.

And there'd be more than one. Accounts had an error. Transfers had an error. Tomorrow Paystack, Mono, and Dojah would each bring their own hooks, their own errors, their own shapes. He could sprinkle `as Error` across every one of them and trust every future teammate to keep sprinkling. Miss one, and the `unknown && <jsx>` rot would silently grow back.

He deleted the cast.

---

The hooks were *generated*. Which meant the error type had exactly one origin: the codegen config. He opened it and added one line.

```ts
// codegen.ts
config: {
  reactQueryVersion: 5,
  errorType: 'Error',   // every hook's .error is typed Error, not unknown
}
```

He regenerated. Accounts, transfers, and every hook that didn't exist yet now typed its error as `Error`. The poisoned JSX resolved. The red went away: not on line 207, not on line 210, but everywhere at once.

He sat with it for a second, because something still nagged him. `errorType: 'Error'` was *also* just a claim. He'd told the compiler the errors were `Error`s; he hadn't made it true. So he opened the fetcher (the one place every request passed through) and made sure it was:

```ts
// graphql/fetcher.ts
if (!res.ok)     throw new Error(`GraphQL request failed: HTTP ${res.status}`);
if (json.errors) throw new Error(json.errors[0].message);
```

Declared at the generator. Guaranteed at the boundary. Now the type and the runtime told the same story, which is the only thing a type was ever for.

---

## The map and the territory

When you're lost in a city and the map says you're at the corner of 5th and Main, you don't argue with the buildings around you. You assume the map is right and you're wrong.

A compiler error is a map, not the territory. Most days the two agree and you fix the line it names. But with JSX children, the map rounds your position to the first landmark (the first child of the fragment) no matter which one is actually off. Tunde wasted ten minutes editing 5th and Main when the pothole was two blocks down. The skill wasn't reading the map. It was knowing when to look up from it.

---

## What this is really about

Two lessons stack here.

The debugging one: **a compiler error's location is a hint, not a fact.** When editing the named line changes nothing, widen your view, especially in JSX, where the blame lands on the first child regardless of which one is wrong.

The architectural one: **when a type problem repeats across many call sites, and those call sites are generated, fix the generator, not the consumers.** Casting patches one file at a time and depends on every future developer to keep patching. Fixing the contract solves it once, for everyone, and pairing the declaration with a runtime guarantee means the type isn't just a hopeful label on a box that might be empty.

**The engineering principle:** A type assertion (`as`) silences the compiler; a type *guarantee* (declared at the generator, enforced at the boundary) earns its silence. When the source of a repeated problem is a generator, fix the generator.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/typed-errors-end-to-end">Typed Errors End-to-End (ADR)</a></li>
<li><a href="../interview/react-architecture">Interview: How do you type errors from data-fetching hooks?</a></li>
<li><a href="../quiz/type-safety">Quiz: Type Safety</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./nates-messy-flat">Nate's Messy Flat: structure that scales</a></li>
</ul>
</div>
