---
sidebar_label: "Architecture & Structure"
---

# Quiz — Architecture & Structure

Covers vertical slices, the shared kernel, and contract-first development. Reference: [Architecture](../architecture) · [ADR: Vertical Slice Architecture](../adrs/vertical-slice-architecture).

---

## Question 1 — Why vertical slices

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Your app organises code by business domain (<code>features/transfers/</code>) instead of by file type (<code>components/</code>, <code>hooks/</code>). What concrete problem does that solve at scale?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

In file-type organisation, understanding or changing one feature means touching four separate trees — `components/`, `hooks/`, `types/`, `tests/`. Two engineers on unrelated features collide in the same folders and produce merge conflicts on files that have nothing to do with each other.

Vertical slices co-locate everything one feature owns. The blast radius of a change is one folder. You can read a feature top to bottom without jumping the tree, and you can delete a feature by deleting its directory. It optimises for the thing teams actually do — change one capability at a time — instead of for an alphabetised filing cabinet.

</div>
</details>

---

## Question 2 — The shared kernel rule

<span class="diff diff--senior">Senior</span>

<div class="interview-q">What's your rule for deciding whether something belongs in <code>shared/</code> versus inside a feature folder?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Something belongs in `shared/` only if it's used by **three or more** slices, or it's a genuine system-wide concern (logging, the HTTP/GraphQL client, error boundaries, formatters). One feature needing a helper? That helper lives in that feature.

The failure mode without the rule: `shared/` becomes a junk drawer. Everything drifts there "just in case," coupling unrelated features through a shared utilities blob — which is the file-type problem wearing a different hat.

</div>
</details>

---

## Question 3 — Contract-first

<span class="diff diff--staff">Staff</span>

<div class="interview-q">You define the GraphQL schema before writing components, then generate types and hooks from it. What does that ordering buy you, and what breaks if you skip it?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

The schema is the single source of truth. Types and React Query hooks are **generated** from it, so the client and the contract cannot silently disagree — if the schema changes, the generated types change, and every consumer that's now wrong fails to compile. You find the break at build time, not in production.

Skip it and you hand-write types that mirror the API by memory. They drift the moment the backend changes a field, and nothing tells you — until a `undefined` shows up in the UI. Contract-first turns "hope the types match" into "the compiler proves the types match," and makes cross-cutting fixes (like typing every hook's error) one config change instead of a manual sweep.

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/nates-messy-flat">Nate's Messy Flat — structure that scales</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/react-architecture">React Architecture Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/vertical-slice-architecture">Vertical Slice Architecture</a></li>
<li><a href="../adrs/api-technology">API Technology Choice</a></li>
</ul>
</div>
