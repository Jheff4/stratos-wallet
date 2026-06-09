---
sidebar_label: "Mocking & Data Flow"
---

# Quiz — Mocking & Data Flow

Covers MSW network interception, the request lifecycle, cache-first reads, and how chaos splices into every endpoint. Reference: [ADR: Failure Simulation](../adrs/failure-simulation) · [ADR: API Technology](../adrs/api-technology).

---

## Question 1 — Why intercept at the network layer

<span class="diff diff--senior">Senior</span>

<div class="interview-q">The app uses MSW, which intercepts real <code>fetch</code> calls at the Service Worker level, instead of mocking the fetch function or the data-fetching modules. Why does that distinction matter?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Because the app makes **genuine** HTTP requests — it doesn't know the backend is fake. MSW catches the request at the network boundary and answers it. Nothing in the component, hook, or fetcher is aware a mock exists.

The payoff: the same code that runs in development against MSW runs in production against the real server. Swapping the backend in changes **zero** lines above the network boundary. Compare that to mocking the fetch function or stubbing modules — those leave mock-shaped seams *inside* your app that you have to unpick later, and they test a different code path than the one you ship. Network-level interception means dev and prod exercise the identical request path.

</div>
</details>

---

## Question 2 — Why most "requests" never leave the app

<span class="diff diff--senior">Senior</span>

<div class="interview-q">You call <code>useAccountsQuery</code> on three different pages in ten seconds. How many network requests actually fire, and why?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

Usually **one**. React Query is a cache first and a fetcher second. The first call computes the key `['Accounts', { walletId }]`, fetches, and stores the result marked *fresh* for `staleTime` (30s here). The next two calls find a fresh entry under the same key and return it **without touching the network**.

The mental-model failure this corrects: thinking "I called the hook, so a request went out." You didn't request data — you *subscribed to a cache key*. React Query decides whether that needs a network trip. Misunderstanding this is how people end up adding manual caching on top of a cache, or expecting fresh data and getting a 30-second-old copy.

</div>
</details>

---

## Question 3 — One splice point for failure

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Every handler starts with <code>const chaos = await applyChaos(); if (chaos) return chaos;</code>. Why is that one line the whole design, and why does chaos return real-looking failures (a 500 with a GraphQL <code>errors</code> body, a 503 with no body) instead of a generic error?</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

**One splice point:** putting the same guard at the top of every resolver makes *every* endpoint failure-injectable with no per-endpoint code. The handler either dies early (chaos returns a Response) or proceeds to real data (chaos returns `null`). Uniformity is the win — you can't forget to make one endpoint testable, because the pattern is mechanical.

**Realistic shapes:** the point of chaos isn't to simulate "an error," it's to simulate the *shapes your error handling must survive*. A 500 carrying `{ errors: [...] }` exercises the fetcher's `json.errors` throw; a 503 with no body makes `res.json()` itself throw; a 206 partial tests the half-success path. If chaos returned a single generic error, you'd only ever test one branch of your error handling and the others would rot untested until production found them.

</div>
</details>

---

## Question 4 — Two copies of the chaos config

<span class="diff diff--staff">Staff</span>

<div class="interview-q">Toggling a chaos preset in the UI does two things: it POSTs to <code>/chaos/config</code> and then calls <code>queryClient.invalidateQueries()</code>. Meanwhile the WebSocket hook needs neither. Explain why.</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

The chaos config lives in **two worlds**. The UI's copy is React state in `ChaosContext`. But the HTTP handlers run inside the **Service Worker**, reading a *separate* module-level `config` in `mocks/chaos.ts` — a different JavaScript context that React state can't reach directly.

- **The POST** is the bridge: it ships the React config across the boundary into the Service Worker's module so `applyChaos()` sees the new settings.
- **`invalidateQueries()`** then forces every cached query to refetch, so you immediately *see* the new failure mode instead of waiting for staleness to expire.
- **The WebSocket hook needs neither** because it lives in React-land and reads `useChaos()` (the context) directly — same world, no boundary to cross.

The deeper lesson: config that must be true in two execution contexts has to be *synchronised*, and you keep one side authoritative (the React UI) pushing to the other (the worker). It's the "two sources of truth" problem in miniature — solved by making one the source and explicitly propagating it.

</div>
</details>

---

## Question 5 — The round trip, in order

<span class="diff diff--senior">Senior</span>

<div class="interview-q">Walk through what happens, in order, from a component calling <code>useAccountsQuery</code> to data on screen — assuming the cache is empty.</div>

<details>
<summary>Show answer</summary>

<div class="interview-a">

1. Hook computes the cache key `['Accounts', { walletId }]`; cache miss → run the `queryFn`.
2. The generated `fetcher` makes a real `POST /graphql`.
3. MSW's Service Worker intercepts it and matches the `Accounts` handler.
4. Handler runs `applyChaos()` first — may inject latency or short-circuit with an error Response.
5. If chaos returns `null`, the handler reads the fake DB (`getWalletById`) and **derives** each balance with `computeBalance(accountId)` from the ledger.
6. The JSON response travels back through MSW → the fetcher → `res.json()`; `json.errors` is checked, then `json.data` is returned.
7. React Query stores the result under the key, marks it fresh for `staleTime`, and hands it to the component, which re-renders.

The two things to name without prompting: the cache check at step 1 (most calls stop there) and the chaos gate at step 4 (every call can fail there).

</div>
</details>

<div class="stratos-related">
<h4>Engineering Stories</h4>
<ul>
<li><a href="../stories/the-chaos-that-wouldnt-happen">The Chaos That Wouldn't Happen — config across a boundary</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Interview Prep</h4>
<ul>
<li><a href="../interview/system-design">System Design Questions</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related decisions</h4>
<ul>
<li><a href="../adrs/failure-simulation">Failure Simulation & Resilience System</a></li>
<li><a href="../adrs/api-technology">API Technology Choice</a></li>
</ul>
</div>
