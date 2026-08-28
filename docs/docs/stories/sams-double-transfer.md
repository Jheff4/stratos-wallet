---
sidebar_label: "Sam's Double Transfer"
---

# Sam's Double Transfer

*Concept: Idempotency keys*

---

Sam is paying rent. It's the 1st of the month. She opens the app, fills in the amount (₦150,000) and taps Send.

Nothing happens.

The button doesn't spin. The screen doesn't change. She waits four seconds. Still nothing. Her WiFi is being weird. She taps Send again.

The transfer goes through.

She gets a push notification: transfer successful. She checks her balance. It's down ₦300,000.

She tapped twice. The money moved twice. Her landlord got paid ₦300,000 and her account is short by an extra ₦150,000 she did not intend to send. Her next three weeks of groceries, gone.

She calls customer support. The support agent pulls up her account and sees two transfers to the same recipient, one second apart, same amount. They can tell she probably didn't mean to send twice. But the system has no way to prove it. Both transfers look identical and both look legitimate.

The company reverses one. But this takes three days because it has to go through a manual review queue. Sam is short on rent money for three days waiting for a reversal on a mistake the app allowed.

---

Now rewind. Same Sam. Same bad WiFi. Same double-tap.

This time, when Sam opens the transfer form, the app does something invisible: before she taps anything, it generates an idempotency key.

```ts
const idempotencyKey = useRef(crypto.randomUUID()); // "a3f2b1c9-..."
```

That key represents this specific transfer attempt: this form session, this user action. It gets sent with the mutation:

```ts
mutate({
  fromAccountId,
  toAccountId,
  amount: 150_000,
  idempotencyKey: idempotencyKey.current,  // "a3f2b1c9-..."
});
```

The first tap hits the server. The server processes the transfer and stores the result against that key:

```ts
idempotencyStore.set("a3f2b1c9-...", { success: true, transaction: ... });
```

Sam's WiFi hiccups. The response never reaches her. The app looks frozen.

She taps again. The second request goes out with the exact same `idempotencyKey`. The server checks the store:

```ts
if (idempotencyStore.has(idempotencyKey)) {
  return idempotencyStore.get(idempotencyKey); // "already did this, here's the result"
}
```

The transfer is not processed again. The server returns the result of the first attempt (success) and Sam sees the confirmation. One transfer. One ₦150,000. Correct.

Her groceries are fine.

---

## The post office analogy

You send an important letter by registered mail. The post office loses the acknowledgement receipt. You don't know if it arrived. You send it again to be safe.

The recipient gets two identical letters.

Now imagine a smarter post office. When you send the letter, it assigns it a unique tracking number. If you send the same letter again with the same tracking number, the post office checks its records: "we already delivered this. Here's the delivery confirmation." You don't send it twice. The recipient gets one letter.

Idempotency is the tracking number.

---

## Why the key is generated before the user taps anything

This is the subtle part. The key must be the same across all retries of the same user action.

If you generate the key inside the mutation handler (the function that fires when the user taps Send), you get a new key every time the user taps. Every tap is treated as a new, unique request. The idempotency achieves nothing.

```ts
// WRONG: generates a new key on every call
function onSubmit() {
  mutate({
    ...formData,
    idempotencyKey: crypto.randomUUID(), // new key every tap
  });
}
```

The key has to be attached to the form session, not to the network request. You generate it once when the form mounts, and it stays fixed for the lifetime of that form. All retries of the same form submission use the same key.

```ts
// CORRECT: key is fixed for this form session
const idempotencyKey = useRef(crypto.randomUUID());

function onSubmit() {
  mutate({
    ...formData,
    idempotencyKey: idempotencyKey.current, // same key every retry
  });
}

// After success, generate a new key for the next transfer
function onSuccess() {
  idempotencyKey.current = crypto.randomUUID();
}
```

---

## What this is really about

The network is unreliable. Responses get lost. Users retry. These are facts, not edge cases.

Idempotency is your acknowledgement of that reality. It says: "I know you might send this twice. I've designed the system so that sending it twice produces the same result as sending it once."

For financial mutations (transfers, payments, refunds, charges) idempotency is not optional. It is the difference between a fintech product and a liability.

**The engineering principle:** Every mutation that has side effects (especially financial ones) must be idempotent. The client generates the key before the request. The server stores the result against that key. Duplicate requests return the cached result, never process again.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
<li><a href="../interview/system-design">Interview: How would you handle a transfer submitted twice?</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./the-optimistic-chef">The Optimistic Chef: what users see during the request</a></li>
</ul>
</div>
