---
sidebar_label: "The Chaos That Wouldn't Happen"
---

# The Chaos That Wouldn't Happen

*Concept: State across an execution boundary · one source of truth*

---

Maya was proud of the chaos panel. A slick sidebar console, fifteen presets, a satisfying toggle. She flipped it to `flakyBackend` — 30% error rate — and reloaded the dashboard to watch it suffer.

The dashboard loaded perfectly. Every widget. Every time.

She bumped the preset to `catastrophicFailure` — 80% errors, half the messages dropped. Reloaded. Still flawless. The balance, the charts, the transaction feed, all green.

For about a minute she was confused in the worst way — the way where you can't tell if your feature works and the app is magically resilient, or your feature does nothing at all. So she opened the network tab. Every GraphQL request: `200 OK`. The chaos panel said catastrophe. The network said calm.

The panel was lying. Or rather — the panel was telling the truth to the wrong listener.

---

Here's what Maya had built. The chaos config was React state, living in a context provider. The panel wrote to it. The WebSocket hook read from it, and *that* part worked — flip a WebSocket preset and the connection genuinely misbehaved.

But the HTTP failures came from the mock handlers. And the mock handlers don't run in React. They run inside the **Service Worker** — a separate JavaScript execution context, its own little world, with its own memory. When a handler asked "what's the current chaos config?", it read a module-level variable that lived *in the worker*. Maya's React state and the worker's module variable were two different objects in two different worlds. Writing to one did nothing to the other.

The toggle updated a config the handlers couldn't see. The handlers consulted a config the toggle never touched. Two sources of truth, politely ignoring each other.

---

She'd seen this shape before — it was the Two Filing Cabinets all over again, just wearing a different coat. The fix was the same: stop keeping two copies in sync by hope. Pick one source, and *push* it across the boundary explicitly.

The React state would be the source of truth. When it changed, it would POST the new config to an endpoint the worker owned:

```ts
async function syncChaosConfig(config: ChaosState) {
  await fetch('/chaos/config', {            // crosses into the worker's world
    method: 'POST',
    body: JSON.stringify(config),
  });
  queryClient.invalidateQueries();          // make the change visible immediately
}
```

The worker had a handler waiting for exactly that:

```ts
http.post('/chaos/config', async ({ request }) => {
  updateChaosConfig(await request.json()); // write the worker's module config
  return HttpResponse.json({ success: true });
});
```

Now the panel didn't *assume* the handlers could see it. It *delivered* the config across the boundary, then invalidated every query so the dashboard refetched under the new conditions and the chaos became visible the instant she toggled it.

She flipped `flakyBackend` again. A third of the widgets threw. The error boundaries lit up. She exhaled — not because it was broken, but because it was finally honest.

---

## Why the WebSocket never had this problem

The detail Maya kept turning over afterward: the WebSocket hook read the *same* React config and worked fine from day one, with no POST, no sync. Why?

Because the WebSocket hook lives in React-land. It and the panel are in the same world, reading the same object. There's no boundary to cross. The HTTP path was the only one that reached into a second execution context — and a second context is exactly where a second copy of "the truth" quietly grows.

---

## What this is really about

Whenever a piece of state has to be true in **two execution contexts** — a main thread and a worker, a client and a server, two tabs — you do not have one value that both can see. You have two values that *look* like one until they drift. The bug is never loud. Nothing errors. The toggle just doesn't toggle anything, and you stand there wondering if your feature is magic or useless.

The discipline is the same every time: name one context the source of truth, and make propagation to the others **explicit and observable** — a POST, a message, an event — never an assumption that "they share it." If you can't point at the line where the value crosses the boundary, it doesn't cross it.

**The engineering principle:** State does not cross an execution boundary for free. One source of truth, pushed across the boundary on purpose — or two copies that drift in silence.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/failure-simulation">Failure Simulation & Resilience System (ADR)</a></li>
<li><a href="../interview/system-design">Interview: Developing and testing without a backend</a></li>
<li><a href="../quiz/mocking-and-data-flow">Quiz: Mocking & Data Flow</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./two-filing-cabinets">The Two Filing Cabinets — one store, no drift</a></li>
</ul>
</div>
