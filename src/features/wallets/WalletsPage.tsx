import { useWalletsQuery, useCreateWalletMutation } from '@graphql/generated';
import { queryClient } from '../../queryClient';
import { useState } from 'react';
import ErrorCard from '@shared/components/ErrorCard';
import DemoBadge from '@shared/components/DemoBadge';

export default function WalletsPage() {
  const { data, isLoading, error } = useWalletsQuery();
  const createWallet = useCreateWalletMutation();
  const [label, setLabel] = useState('');
  const [feedback, setFeedback] = useState('');

  const handleCreate = async () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    try {
      await createWallet.mutateAsync({ label: trimmed });
      await queryClient.invalidateQueries({ queryKey: ['Wallets'] });
      setLabel('');
      setFeedback('Wallet created.');
      setTimeout(() => setFeedback(''), 3000);
    } catch {
      setFeedback('Failed to create wallet.');
    }
  };

  const wallets = data?.wallets ?? [];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Wallets</h1>
        <p className="page-subtitle">Manage your wallets and linked accounts</p>
        <DemoBadge concepts={[
          { label: 'Contract-first GraphQL', path: '/adrs/api-technology' },
          { label: 'Targeted cache invalidation', path: '/adrs/state-management' },
        ]} />
      </div>

      <div className="page-body flex-col gap-6">
        {/* Create wallet */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">New Wallet</div>
              <div className="card-subtitle">Add a new wallet to your account</div>
            </div>
          </div>
          <div className="card-body">
            <div className="flex gap-3 items-center">
              <input
                className="form-control"
                style={{ maxWidth: 320 }}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. Savings, Business, Travel"
              />
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={createWallet.isPending || !label.trim()}
              >
                {createWallet.isPending ? 'Creating…' : 'Create Wallet'}
              </button>
            </div>
            {feedback && (
              <div className={`alert mt-4 ${feedback.startsWith('Failed') ? 'alert-error' : 'alert-success'}`}>
                {feedback}
              </div>
            )}
          </div>
        </div>

        {/* Wallet list */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Your Wallets</div>
              <div className="card-subtitle">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="card-body flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '4px 0' }}>
                  <div className="skeleton" style={{ height: 18, flex: 3, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 18, width: 90, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 22, width: 56, borderRadius: 99 }} />
                </div>
              ))}
            </div>
          ) : error ? (
            <ErrorCard message={(error as Error).message} onRetry={() => queryClient.invalidateQueries({ queryKey: ['Wallets'] })} />
          ) : wallets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <p className="empty-state-text">No wallets yet. Create one above to get started.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Wallet</th>
                    <th>ID</th>
                    <th>Accounts</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((wallet) => (
                    <tr key={wallet.id}>
                      <td className="font-semibold">{wallet.label}</td>
                      <td className="text-mono text-muted">{wallet.id}</td>
                      <td>{wallet.accounts?.length ?? 0} account{(wallet.accounts?.length ?? 0) !== 1 ? 's' : ''}</td>
                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
