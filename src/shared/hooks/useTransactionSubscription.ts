import { useCallback } from 'react';
import { queryClient } from '../../queryClient';
import { useWebSocket } from './useWebSocket';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  createdAt: string;
  sourceAccountId: string;
  destinationAccountId: string;
}

export function useTransactionSubscription() {
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'new_transaction') {
      const newTransaction = data.transaction as Transaction;
      // Update the infinite query cache for all account‑specific feeds
      // We target the query key pattern ['Transactions.infinite', ...]
      queryClient.setQueriesData(
        { queryKey: ['Transactions.infinite'] },
        (old: any) => {
          if (!old || !old.pages) return old;
          // Clone pages and prepend the new transaction to the first page
          const newPages = [...old.pages];
          const firstPage = { ...newPages[0] };
          firstPage.transactions = {
            ...firstPage.transactions,
            edges: [
              {
                node: newTransaction,
                cursor: newTransaction.id,
                __typename: 'TransactionEdge',
              },
              ...firstPage.transactions.edges,
            ],
          };
          newPages[0] = firstPage;
          return {
            ...old,
            pages: newPages,
          };
        },
      );
    }
  }, []);

  useWebSocket('ws://localhost:8080', handleMessage);
}