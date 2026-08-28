---
sidebar_label: "The Optimistic Chef"
---

# The Optimistic Chef

*Concept: Optimistic updates and rollback*

---

Sam orders a pizza. The app shows a 30-minute wait. She taps the order button.

In app A, nothing happens for two seconds. Then a spinner. Then three more seconds. Then "Order placed!" The whole interaction took about five seconds of apparent doing-nothing before she got confirmation.

In app B, the moment she taps, the UI switches to the order confirmation screen. Her order appears. An estimated time shows. The experience feels instant.

Both apps made the same network request to the same server. App B just didn't wait for the response before updating the UI.

App B is *optimistic*. It assumes the request will succeed, because it usually does, and shows the result immediately. If the request fails, it reverses the change.

---

Azeez is doing a fund transfer. He selects source account, destination account, enters ₦75,000, and taps Send.

**Without optimistic updates:**

He taps. A loading spinner appears over the transfer button. The page goes unresponsive for 800ms while the GraphQL mutation round-trips. Then the balance updates. The spinner disappears. The transaction appears in the feed. Total perceived wait: 800ms.

This isn't terrible. But over a flaky Nigerian mobile network it becomes 2 seconds. On slow 3G it becomes 4 seconds. Every second of a loading spinner erodes the feeling that the app is working.

**With optimistic updates:**

He taps. The balance changes immediately. The new transaction appears at the top of the feed immediately. There is no spinner over the button. The request is happening in the background, but Azeez doesn't see it. Total perceived wait: 0ms.

---

## The chef analogy

A chef at a market stall takes your order for jollof rice. There are two styles.

The **conservative chef** says: let me prepare it, confirm it's ready, and then tell you it's done. You stand there watching him cook. Eight minutes later: "Here it is." You've been waiting the whole time.

The **optimistic chef** says: here's a receipt, your order is in, expected in eight minutes. You wander off, browse the market, come back when it's ready. The same eight minutes pass, but your experience of them is different. You were free. The work was happening in the background.

Both chefs take exactly the same time. But the optimistic chef's customers leave happier.

The rollback case: occasionally the market runs out of an ingredient. The optimistic chef calls you back and says "sorry, I can't make that today, here's a refund." That's the `onError` rollback. It happens rarely, and when it does, it's a minor inconvenience. The benefit across all the times it doesn't happen far outweighs the cost.

---

## How it works in code

React Query's mutation lifecycle has three key moments: `onMutate`, `onError`, and `onSettled`.

```ts
useMutation({
  mutationFn: transferFunds,

  onMutate: async ({ fromAccountId, toAccountId, amount }) => {
    // 1. Freeze any in-flight queries: we don't want them to
    //    overwrite our optimistic update with stale server data
    await queryClient.cancelQueries({ queryKey: ['accounts'] });

    // 2. Snapshot the current state: this is our "undo" save point
    const snapshot = queryClient.getQueryData(['accounts', walletId]);

    // 3. Apply the expected result immediately
    //    The UI shows this right now, before the server responds
    queryClient.setQueryData(['accounts', walletId], (accounts) =>
      accounts.map((acc) => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId)   return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    // 4. Return the snapshot so onError can restore it
    return { snapshot };
  },

  onError: (_error, _variables, context) => {
    // Something went wrong. Undo.
    // Restore exactly what was there before the user tapped Send.
    if (context?.snapshot) {
      queryClient.setQueryData(['accounts', walletId], context.snapshot);
    }
  },

  onSettled: () => {
    // Whether it succeeded or failed, ask the server for the
    // real, authoritative balance. Our optimistic value was an
    // assumption. This confirms or corrects it.
    queryClient.invalidateQueries({ queryKey: ['accounts', walletId] });
  },
});
```

Three moments, each with a job:
- `onMutate`: snapshot, then show the expected result
- `onError`: restore the snapshot
- `onSettled`: ask the server what really happened

---

## The rollback is not failure. It is the safety net.

Some engineers avoid optimistic updates because they fear the rollback case. "What if it fails? The user saw a wrong balance."

Think about it from the user's perspective. The balance showed ₦525,000 for half a second, then snapped back to ₦600,000 with an error toast: "Transfer failed, please try again."

Is that bad? It's a small visual correction. Compare it to the alternative: the user stared at a spinner for two seconds before being told the transfer failed. Same outcome, worse experience.

The rollback is not a problem to avoid. It is a feature. It means the UI is honest: it shows what it expects, and it corrects itself when it's wrong. The alternative is showing nothing and being slow.

---

## The one thing you must never skip

`onSettled` calls `queryClient.invalidateQueries()`. This forces a refetch from the server after the mutation, whether it succeeded or failed.

Why refetch after success? Because the optimistic update was a guess. You guessed the balance would be `600,000 - 75,000 = 525,000`. The server might have applied a fee, a rounding adjustment, or a daily limit that changes the actual result. The refetch replaces your guess with the truth.

Skip this and your UI will sometimes show a slightly wrong balance that never corrects itself, because the optimistic value sits in the cache indefinitely, never challenged.

---

## What this is really about

Optimistic updates are a user experience contract: "We assume things go well. We show you the result immediately. We correct ourselves if we're wrong."

They require three things to be safe: a snapshot for rollback, a discriminating update that only changes exactly what the mutation affects, and a refetch on settle that replaces the assumption with the truth.

Done correctly, they make an application feel like it's running locally. Done incorrectly, they show users wrong data and confuse them further when it snaps back. The difference is the discipline of the three-phase pattern.

**The engineering principle:** Assume success, act immediately, snapshot for rollback, always refetch on settle. Optimism is a user experience choice. Correctness is still non-negotiable.

<div class="stratos-related">
<h4>Go Deeper</h4>
<ul>
<li><a href="../adrs/idempotency-and-optimistic-updates">Idempotency & Optimistic Updates</a></li>
<li><a href="../interview/react-architecture">Interview: Optimistic updates and when they can go wrong</a></li>
</ul>
</div>

<div class="stratos-related">
<h4>Related Stories</h4>
<ul>
<li><a href="./sams-double-transfer">Sam's Double Transfer: protecting the mutation itself</a></li>
</ul>
</div>
