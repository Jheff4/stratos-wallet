import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTransactionFeed } from './hooks/useTransactionFeed';
import { formatCurrency } from '@shared/utils/formatters';
import ErrorCard from '@shared/components/ErrorCard';

// Transaction type → badge variant
function txBadge(type: string) {
  switch (type.toUpperCase()) {
    case 'DEPOSIT':    return { cls: 'badge-success', label: 'Deposit'    };
    case 'WITHDRAWAL': return { cls: 'badge-danger',  label: 'Withdrawal' };
    case 'TRANSFER':   return { cls: 'badge-info',    label: 'Transfer'   };
    default:           return { cls: 'badge-neutral', label: type         };
  }
}

// Amount sign: deposits are positive, everything else negative
function amountClass(type: string) {
  return type.toUpperCase() === 'DEPOSIT' ? 'amount-positive' : 'amount-negative';
}

function amountPrefix(type: string) {
  return type.toUpperCase() === 'DEPOSIT' ? '+' : '−';
}

export default function TransactionHistoryPage() {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId') ?? undefined;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionFeed(accountId);

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allEdges = data?.pages.flatMap((page) => page?.transactions?.edges ?? []) ?? [];
  // TODO(contract-first): `totalCount` is not in the GraphQL schema yet. Expose it
  // properly via schema → query → mock resolver → codegen before showing a total.
  // Until then we only know how many edges we've loaded, not the true total.
  const loadedCount = allEdges.length;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Transaction History</h1>
        <p className="page-subtitle">
          {accountId ? `Filtered by account ${accountId}` : 'All recent activity'}
          {loadedCount > 0 ? ` · ${loadedCount.toLocaleString()} loaded` : ''}
        </p>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">All Transactions</div>
              <div className="card-subtitle">Scroll to load more — new transactions arrive in real time</div>
            </div>
          </div>

          {isLoading ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Description</th><th>Type</th><th>From → To</th><th>Date</th><th style={{textAlign:'right'}}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td><div className="skeleton" style={{ height: 13, width: '70%', borderRadius: 3 }} /><div className="skeleton" style={{ height: 10, width: '40%', borderRadius: 3, marginTop: 5 }} /></td>
                      <td><div className="skeleton" style={{ height: 20, width: 70, borderRadius: 99 }} /></td>
                      <td><div className="skeleton" style={{ height: 13, width: 80, borderRadius: 3 }} /></td>
                      <td><div className="skeleton" style={{ height: 13, width: 70, borderRadius: 3 }} /></td>
                      <td style={{textAlign:'right'}}><div className="skeleton" style={{ height: 13, width: 80, borderRadius: 3, marginLeft: 'auto' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : isError ? (
            <ErrorCard message="Failed to load transactions." onRetry={() => window.location.reload()} />
          ) : allEdges.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p className="empty-state-text">No transactions yet.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>From → To</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {allEdges.map((edge) => {
                    const t = edge?.node;
                    if (!t) return null;
                    const badge = txBadge(t.type);
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="font-semibold">{t.description}</div>
                          <div className="text-sm text-muted text-mono">{t.id}</div>
                        </td>
                        <td>
                          <span className={`badge ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="text-mono text-sm text-muted">
                          {t.sourceAccountId} → {t.destinationAccountId}
                        </td>
                        <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap' }}>
                          {new Date(t.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                          <br />
                          <span style={{ fontSize: 11 }}>
                            {new Date(t.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span className={amountClass(t.type)}>
                            {amountPrefix(t.type)}{formatCurrency(t.amount, t.currency)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Infinite scroll sentinel */}
              <div ref={loadMoreRef} style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                {isFetchingNextPage && (
                  <div className="skeleton" style={{ height: 4, borderRadius: 2, maxWidth: 200, margin: '0 auto' }} />
                )}
                {!hasNextPage && allEdges.length > 0 && (
                  <span className="text-sm text-muted">All transactions loaded</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
