import { useAccountsQuery } from '@graphql/generated';
import { usePrefetchTransactions } from '@shared/hooks/usePrefetchTransactions';
import { formatCurrency } from '@shared/utils/formatters';
import ErrorCard from '@shared/components/ErrorCard';
import DemoBadge from '@shared/components/DemoBadge';
import { Link } from 'react-router-dom';

function AccountSkeleton() {
  return (
    <>
      {/* Stat cards skeleton */}
      <div className="grid-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 3 }} />
            <div className="skeleton" style={{ height: 28, width: 140, borderRadius: 4, marginTop: 8 }} />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 4 }} />
            <div className="skeleton" style={{ height: 11, width: 200, borderRadius: 3 }} />
          </div>
        </div>
        <div className="card-body flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '8px 0' }}>
              <div className="skeleton" style={{ height: 36, flex: 2, borderRadius: 6 }} />
              <div className="skeleton" style={{ height: 24, width: 56, borderRadius: 99 }} />
              <div className="skeleton" style={{ height: 20, width: 100, borderRadius: 4, marginLeft: 'auto' }} />
              <div className="skeleton" style={{ height: 24, width: 56, borderRadius: 99 }} />
              <div className="skeleton" style={{ height: 30, width: 110, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function AccountListPage() {
  const { data, isLoading, error, refetch } = useAccountsQuery({ walletId: 'w1' });
  const prefetchTransactions = usePrefetchTransactions();

  const accounts = data?.accounts ?? [];
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  if (isLoading) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">All accounts linked to your wallet</p>
        </div>
        <div className="page-body flex-col gap-6">
          <AccountSkeleton />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="page-header">
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">All accounts linked to your wallet</p>
        </div>
        <div className="page-body">
          <div className="card">
            <ErrorCard
              message={(error as Error).message}
              onRetry={() => refetch()}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Accounts</h1>
        <p className="page-subtitle">All accounts linked to your wallet</p>
        <DemoBadge concepts={[
          { label: 'Balances are derived, never stored', path: '/adrs/ledger-first-data-model' },
          { label: "O(n) reads & snapshots",             path: '/stories/sams-invisible-bug' },
        ]} />
      </div>

      <div className="page-body flex-col gap-6">
        {/* Summary stats */}
        {accounts.length > 0 && (
          <div className="grid-3">
            <div className="stat-card">
              <div className="stat-label">Total Balance</div>
              <div className="stat-value">{formatCurrency(totalBalance)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Accounts</div>
              <div className="stat-value">{accounts.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Currencies</div>
              <div className="stat-value">{[...new Set(accounts.map((a) => a.currency))].join(', ')}</div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Account Overview</div>
              <div className="card-subtitle">Hover a row to prefetch its transactions</div>
            </div>
          </div>

          {accounts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏦</div>
              <p className="empty-state-text">No accounts found for this wallet.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Currency</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} onMouseEnter={() => prefetchTransactions()}>
                      <td>
                        <div className="font-semibold">{account.name}</div>
                        <div className="text-sm text-muted text-mono">{account.id}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{account.currency}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="font-bold">{formatCurrency(account.balance, account.currency)}</span>
                      </td>
                      <td>
                        <span className="badge badge-success">Active</span>
                      </td>
                      <td>
                        <Link to={`/transactions?accountId=${account.id}`} className="btn btn-secondary btn-sm">
                          Transactions →
                        </Link>
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
