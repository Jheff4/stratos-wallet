import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useTransactionFeed } from './hooks/useTransactionFeed';

export default function TransactionHistoryPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionFeed();

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div>Loading transactions...</div>;
  if (isError) return <div>Error loading transactions.</div>;

  const allEdges = data?.pages.flatMap((page) => page?.transactions?.edges ?? []) ?? [];

  return (
    <div>
      <h1>Transaction History</h1>
      <ul style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #ccc', padding: '1rem' }}>
        {allEdges.map((edge) => {
          const t = edge?.node;
          if (!t) return null;
          return (
            <li key={t.id} style={{ marginBottom: '1rem' }}>
              <strong>{t.description}</strong><br />
              {t.type} — {t.currency} {t.amount.toLocaleString()}<br />
              <small>{new Date(t.createdAt).toLocaleString()}</small>
              <br />
              <small>Source: {t.sourceAccountId}</small>
              <br />
              <small>Destination: {t.destinationAccountId}</small>
            </li>
          );
        })}
        <div ref={loadMoreRef}>
          {isFetchingNextPage && <p>Loading more...</p>}
          {!hasNextPage && <p>End of transactions.</p>}
        </div>
      </ul>
    </div>
  );
}
