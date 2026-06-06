import { useCallback } from 'react';
import { queryClient } from '../../queryClient';
import { useWebSocket, type WSMessage } from './useWebSocket';
import { useAppStore } from '../../store';
import { toastTransaction } from '@shared/components/Toast';

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
  const addEvent   = useAppStore((s) => s.addEvent);
  const setWsStatus = useAppStore((s) => s.setWsStatus);

  const handleMessage = useCallback((data: WSMessage) => {
    // -- Track WS events in the activity feed --
    if (data.seq !== undefined && data.eventId !== undefined) {
      addEvent({
        id:         data.eventId,
        seq:        data.seq,
        type:       data.type,
        receivedAt: new Date().toISOString(),
        replayed:   data.replayed ?? false,
        payload:    data as unknown as Record<string, unknown>,
      });
    }

    if (data.type === 'new_transaction') {
      const newTransaction = data.transaction as Transaction;

      // -- Update infinite query cache --
      queryClient.setQueriesData(
        { queryKey: ['Transactions.infinite'] },
        (old: any) => {
          if (!old || !old.pages) return old;
          const newPages = [...old.pages];
          const firstPage = { ...newPages[0] };
          firstPage.transactions = {
            ...firstPage.transactions,
            edges: [
              { node: newTransaction, cursor: newTransaction.id, __typename: 'TransactionEdge' },
              ...firstPage.transactions.edges,
            ],
          };
          newPages[0] = firstPage;
          return { ...old, pages: newPages };
        },
      );

      // -- Toast notification --
      toastTransaction(newTransaction);
    }
  }, [addEvent]);

  const { status } = useWebSocket('ws://localhost:8080', handleMessage);

  // Sync WS status to the global store so the sidebar indicator can read it
  useCallback(() => {
    setWsStatus(status);
  }, [status, setWsStatus])();
}
