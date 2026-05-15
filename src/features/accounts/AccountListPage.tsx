import { useAccountsQuery } from '@graphql/generated';
import { usePrefetchTransactions } from '@shared/hooks/usePrefetchTransactions';
import { Link } from 'react-router-dom';

export default function AccountListPage() {
  const { data, isLoading, error } = useAccountsQuery({ walletId: 'w1' });
  const prefetchTransactions = usePrefetchTransactions();

  if (isLoading) return <div>Loading accounts...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  const accounts = data?.accounts ?? [];
  return (
    <div>
      <h1>Your Accounts</h1>
      <ul>
        {accounts.map((account) => (
          <li
            key={account.id}
            onMouseEnter={() => prefetchTransactions()}
          >
            {account.name} — {account.currency} {account.balance.toLocaleString()}
            <Link to={`/transactions?accountId=${account.id}`}>View transactions</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}