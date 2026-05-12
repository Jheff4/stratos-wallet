import { useWalletsQuery, useCreateWalletMutation } from '@graphql/generated';
import { useState } from 'react';

export default function WalletsPage() {
  const { data, isLoading, error } = useWalletsQuery();
  const createWallet = useCreateWalletMutation();
  const [label, setLabel] = useState('');

  const handleCreate = async () => {
    await createWallet.mutateAsync({ label });
    setLabel('');
  };

  if (isLoading) return <div>Loading wallets...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  const wallets = data?.wallets ?? [];

  return (
    <div>
      <h1>Wallets</h1>
      <div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="New wallet label"
        />
        <button onClick={handleCreate}>Create Wallet</button>
      </div>
      <ul>
        {wallets.map((wallet) => (
          <li key={wallet.id}>
            {wallet.label} — {wallet.accounts?.length} accounts
          </li>
        ))}
      </ul>
    </div>
  );
}