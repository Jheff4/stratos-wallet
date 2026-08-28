# Transfers Feature

A transfer moves funds from one account to another within the same wallet. It is the highest-stakes user action in the application: a bug here produces incorrect balances, a broken experience, or (in a real system) a financial loss.

---

## Domain definition

**Transfer** (noun): A financial operation that debits a source account and credits a destination account by the same amount, recorded as a single `LedgerEntry` of type `TRANSFER`.

A transfer is atomic from the user's perspective: either both sides happen or neither does. In this system, both sides are recorded in one ledger entry (`sourceAccountId` and `destinationAccountId` on the same entry). There is no state where one side has applied and the other has not.

---

## Process

The transfer flow follows this sequence:

1. **User fills the transfer form**: selects source account, destination account, and amount.
2. **Client generates an idempotency key**: `crypto.randomUUID()` before the mutation is sent.
3. **Optimistic update applied**: the local cache reflects the expected new balances immediately.
4. **Mutation sent**: `transferFunds` GraphQL mutation with `fromAccountId`, `toAccountId`, `amount`, `idempotencyKey`.
5. **Server processes or deduplicates**: if the server has seen this idempotency key before, it returns the cached result without creating a second entry.
6. **On success**: `onSettled` invalidates `['accounts', fromId]` and `['accounts', toId]`. Fresh balances are fetched.
7. **On error**: `onError` restores the snapshot taken in `onMutate`. The UI returns to the pre-transfer state.

---

## Idempotency

### Why it exists

A user taps "Transfer" and the request leaves the device. The network drops. The user taps again. The server receives two requests.

Without idempotency, the transfer executes twice. The user has moved twice the intended amount.

With idempotency, the server detects the duplicate key and returns the result of the first execution. One transfer, two requests, correct outcome.

### How it works

The client generates the key with `crypto.randomUUID()` **before** the form is submitted, not inside the mutation handler. This ensures the same key is used for all retry attempts of the same user action.

```ts
const idempotencyKey = useRef(crypto.randomUUID());

// On form submit:
mutate({ fromAccountId, toAccountId, amount, idempotencyKey: idempotencyKey.current });
```

The server stores the key and its result:

```ts
if (idempotencyStore.has(idempotencyKey)) {
  return idempotencyStore.get(idempotencyKey); // return cached result
}
// process transfer, store result
idempotencyStore.set(idempotencyKey, result);
```

After a successful transfer, a new `idempotencyKey` is generated so the next transfer is treated as a fresh operation.

:::caution
The key must be generated once per user-initiated action, not on every render. A key generated inside the mutation handler would be different on every retry, defeating the purpose.
:::

---

## Optimistic updates

### Why it exists

Network requests take time. Without optimistic updates, the user taps "Transfer" and nothing happens for 200–1000ms. Then the balance changes. The app feels slow.

With optimistic updates, the balance changes the moment the user confirms. If the transfer fails, the balance reverts. The app feels instant.

### The React Query pattern

```ts
useMutation({
  mutationFn: transferFunds,

  onMutate: async ({ fromAccountId, toAccountId, amount }) => {
    // 1. Cancel in-flight queries that could overwrite our optimistic update
    await queryClient.cancelQueries({ queryKey: ['accounts', walletId] });

    // 2. Snapshot the current cache (needed for rollback)
    const snapshot = queryClient.getQueryData(['accounts', walletId]);

    // 3. Apply the optimistic update
    queryClient.setQueryData(['accounts', walletId], (old) =>
      old?.map((acc) => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId)   return { ...acc, balance: acc.balance + amount };
        return acc;
      })
    );

    // 4. Return snapshot as context for potential rollback
    return { snapshot };
  },

  onError: (_err, _vars, context) => {
    // Rollback to the snapshot
    if (context?.snapshot) {
      queryClient.setQueryData(['accounts', walletId], context.snapshot);
    }
  },

  onSettled: () => {
    // Always refetch: whether the mutation succeeded or failed
    queryClient.invalidateQueries({ queryKey: ['accounts', walletId] });
  },
})
```

:::info Why `onSettled` refetches after success
The optimistic update sets what we *expect* the server to return. The server may apply rounding, fees, or other adjustments. `onSettled` ensures the final displayed balance is the server's authoritative value, not our assumption.
:::

---

## Failure mode table

| Failure | UI Response | Recovery Strategy |
|---|---|---|
| Network timeout | Optimistic rollback | User retries; same idempotency key prevents duplicate |
| Server error (5xx) | Optimistic rollback + error toast | Manual retry |
| Duplicate submission (double-tap) | Server deduplicates | `idempotencyStore` returns cached result |
| Insufficient funds (client-side) | Validation prevents submission | Form error message |
| Insufficient funds (server-side) | Rollback + specific error message | User adjusts amount |
| Partial network failure (request sent, response lost) | Optimistic rollback on timeout | Retry with same key; server deduplicates |

---

## What's not yet implemented

- Server-side insufficient funds validation with specific error codes
- Transfer confirmation step (show summary before executing)
- Transfer history per transfer (separate from transaction feed)
- Multi-wallet transfers (cross-wallet is blocked by account ownership rules)
- Daily transfer limit enforcement
