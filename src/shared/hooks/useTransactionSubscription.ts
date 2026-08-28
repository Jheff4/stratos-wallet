import { useCallback, useEffect } from 'react';
import { queryClient } from '../../queryClient';
import { useWebSocket, type WSMessage } from './useWebSocket';
import { useAppStore } from '../../store';
import { toastTransaction } from '@shared/components/Toast';
import { addLedgerEntry, type LedgerEntry } from '../../mocks/data';

export function useTransactionSubscription() {
  const addEvent    = useAppStore((s) => s.addEvent);
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
      const incoming = data.transaction as LedgerEntry;

      // Write through the ledger (the same door a transfer uses) instead
      // of patching the query cache directly. This is what makes a
      // WS-pushed transaction a REAL transaction: it moves balances,
      // survives a refetch, and can't disagree with the rest of the app.
      addLedgerEntry(incoming);

      // Invalidate every projection of the ledger: the same set a
      // transfer's onSettled invalidates (see TransferPage.tsx). One
      // write path, one invalidation set: Activity, History, and Balance
      // can no longer show three different stories about the same event.
      queryClient.invalidateQueries({ queryKey: ['Accounts'] });
      queryClient.invalidateQueries({ queryKey: ['Wallets'] });
      queryClient.invalidateQueries({ queryKey: ['BalanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['SpendingByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['Transactions.infinite'] });

      toastTransaction(incoming);
    }
  }, [addEvent]);

  const { status } = useWebSocket('ws://localhost:8080', handleMessage);

  // Sync WS status to the global store whenever it changes.
  //
  // Interview defense: this used to be `useCallback(() => setWsStatus(status),
  // [status, setWsStatus])()`, creating a memoized callback and immediately
  // invoking it. That runs the assignment on every render regardless of
  // whether `status` changed; useCallback's dependency array only controls
  // whether a NEW function is handed out, not whether the code inside runs.
  // It was harmless here (setting the same status twice is a no-op in
  // Zustand) but it's the wrong tool: side effects that should run "when X
  // changes" belong in useEffect, gated by its own dependency array.
  useEffect(() => {
    setWsStatus(status);
  }, [status, setWsStatus]);
}
