import { useState } from 'react';
import { useAccountsQuery, useTransferFundsMutation } from '@graphql/generated';
import { queryClient } from '../../queryClient';

export default function TransferPage() {
  const { data: accountsData, isLoading: accountsLoading } = useAccountsQuery({ walletId: 'w1' });
  const accounts = accountsData?.accounts ?? [];

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const transferMutation = useTransferFundsMutation({
    onMutate: async ({ fromAccountId, toAccountId, amount }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });

      // Snapshot the previous value
      const previousAccounts = queryClient.getQueryData(['Accounts', { walletId: 'w1' }]);

      // Optimistically update the cache
      queryClient.setQueryData(['Accounts', { walletId: 'w1' }], (old: any) => {
        if (!old?.accounts) return old;
        return {
          accounts: old.accounts.map((acc: any) => {
            if (acc.id === fromAccountId) {
              return { ...acc, balance: acc.balance - amount };
            }
            if (acc.id === toAccountId) {
              return { ...acc, balance: acc.balance + amount };
            }
            return acc;
          }),
        };
      });

      // Return the snapshot for rollback
      return { previousAccounts };
    },

    onSuccess: (data) => {
      if (data.transferFunds?.success) {
        setMessage('Transfer successful!');
        // Invalidate to ensure final server truth
        queryClient.invalidateQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });
      } else {
        setMessage('Transfer failed. Check balance.');
        // Rollback if server said no
        queryClient.invalidateQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });
      }
    },

    onError: (_error, _variables, context) => {
      setMessage('Network error. Changes rolled back.');
      // Rollback to the snapshot
      if (context?.previousAccounts) {
        queryClient.setQueryData(['Accounts', { walletId: 'w1' }], context.previousAccounts);
      }
    },
    retry: false, // Never retry a financial mutation automatically
  });

  const handleSubmit = () => {
    if (!fromAccountId || !toAccountId || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    // Generate a fresh idempotency key per submission
    const idempotencyKey = crypto.randomUUID();

    transferMutation.mutate({
      fromAccountId,
      toAccountId,
      amount: amountNum,
      idempotencyKey,
    });

    // Clear message while processing
    setMessage('Processing...');
  };

  if (accountsLoading) return <div>Loading accounts...</div>;

  return (
    <div>
      <h1>Transfer Funds</h1>
      <div>
        <label>From Account:</label>
        <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
          <option value="">-- Select --</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (Balance: {a.balance.toLocaleString()})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>To Account:</label>
        <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)}>
          <option value="">-- Select --</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} (Balance: {a.balance.toLocaleString()})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Amount ($):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={transferMutation.isPending}
      >
        {transferMutation.isPending ? 'Sending...' : 'Transfer'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}