import { useAccountsQuery } from '@graphql/generated';
// import { Link } from 'react-router-dom';

export default function AccountListPage() {
  const { data, isLoading, error } = useAccountsQuery({ walletId: 'w1' }); // hardcoded for now

  if (isLoading) return <div>Loading accounts...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  const accounts = data?.accounts ?? [];
  return (
    <div>
      <h1>Your Accounts</h1>
      <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            {account.name} — {account.currency} {account.balance.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
