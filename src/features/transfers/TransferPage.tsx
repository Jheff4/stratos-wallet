import { useState } from 'react';
import { useAccountsQuery, useTransferFundsMutation, type AccountsQuery } from '@graphql/generated';
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
      await queryClient.cancelQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });

      // Snapshot the ORIGINAL data (before any optimistic updates)
      const previousAccounts = queryClient.getQueryData(['Accounts', { walletId: 'w1' }]);

      // Optimistically update
      queryClient.setQueryData(['Accounts', { walletId: 'w1' }], (old: AccountsQuery | undefined) => {
        if (!old?.accounts) return old;
        return {
          accounts: old.accounts.map((acc) => {
            if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
            if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
            return acc;
          }),
        };
      });

      return { previousAccounts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['Accounts', { walletId: 'w1' }], context.previousAccounts);
      }
      setMessage('Transfer failed. Rolled back.');
    },
    onSettled: () => {
      // Always refetch the server truth after mutation settles
      queryClient.invalidateQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });
      queryClient.invalidateQueries({ queryKey: ['Wallets'] });
    },
    onSuccess: (data) => {
      if (data.transferFunds?.success) {
        setMessage('Transfer successful!');
      } else {
        setMessage('Transfer failed. Check balance.');
      }
    },
    retry: false,
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
