import { useState } from 'react';
import { useAccountsQuery, useTransferFundsMutation, type AccountsQuery } from '@graphql/generated';
import { queryClient } from '../../queryClient';
import { formatCurrency } from '@shared/utils/formatters';
import ErrorCard from '@shared/components/ErrorCard';
import DemoBadge from '@shared/components/DemoBadge';

// ---- Loading skeleton ----
function TransferSkeleton() {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: 200, borderRadius: 3 }} />
        </div>
      </div>
      <div className="card-body flex-col gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-col gap-2">
            <div className="skeleton" style={{ height: 11, width: 80, borderRadius: 3 }} />
            <div className="skeleton" style={{ height: 40, borderRadius: 6 }} />
          </div>
        ))}
        <div className="skeleton" style={{ height: 44, borderRadius: 6 }} />
      </div>
    </div>
  );
}

// ---- Success summary card ----
interface TransferSuccessProps {
  amount: number;
  fromName: string;
  toName: string;
  onReset: () => void;
}

function TransferSuccess({ amount, fromName, toName, onReset }: TransferSuccessProps) {
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card-body" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56,
          borderRadius: '50%',
          background: 'var(--color-success-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-5)',
          fontSize: 22,
        }}>
          ✓
        </div>

        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
          Transfer complete
        </div>

        {/* Amount */}
        <div style={{
          fontSize: 32, fontWeight: 800,
          color: 'var(--color-success)',
          letterSpacing: '-0.04em',
          margin: 'var(--space-4) 0',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {formatCurrency(amount)}
        </div>

        {/* From → To */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>From</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{fromName}</div>
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>→</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>To</div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{toName}</div>
          </div>
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onReset}>
          Make another transfer
        </button>
      </div>
    </div>
  );
}

// ---- Main page ----
export default function TransferPage() {
  const { data: accountsData, isLoading: accountsLoading, error: accountsError, refetch } =
    useAccountsQuery({ walletId: 'w1' });
  const accounts = accountsData?.accounts ?? [];

  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId,   setToAccountId]   = useState('');
  const [amount,        setAmount]         = useState('');

  type TransferStatus = 'idle' | 'pending' | 'success' | 'error';
  const [status,  setStatus]  = useState<TransferStatus>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const [lastTransfer, setLastTransfer] = useState<{ amount: number; fromName: string; toName: string } | null>(null);

  const transferMutation = useTransferFundsMutation({
    onMutate: async ({ fromAccountId, toAccountId, amount }) => {
      await queryClient.cancelQueries({ queryKey: ['Accounts', { walletId: 'w1' }] });
      const previousAccounts = queryClient.getQueryData(['Accounts', { walletId: 'w1' }]);
      queryClient.setQueryData(['Accounts', { walletId: 'w1' }], (old: AccountsQuery | undefined) => {
        if (!old?.accounts) return old;
        return {
          accounts: old.accounts.map((acc) => {
            if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
            if (acc.id === toAccountId)   return { ...acc, balance: acc.balance + amount };
            return acc;
          }),
        };
      });
      return { previousAccounts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAccounts) {
        queryClient.setQueryData(['Accounts', { walletId: 'w1' }], context.previousAccounts);
      }
      const raw = (_error as Error).message ?? '';
      const isChaos = raw.toLowerCase().includes('chaos') || raw.toLowerCase().includes('simulated');
      setStatus('error');
      setErrMsg(isChaos ? 'A chaos fault interrupted this transfer. Your balance has been restored.' : 'Transfer failed. Your balance has been restored.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['Accounts'] });
      queryClient.invalidateQueries({ queryKey: ['Wallets'] });
      queryClient.invalidateQueries({ queryKey: ['BalanceHistory'] });
      queryClient.invalidateQueries({ queryKey: ['SpendingByCategory'] });
      queryClient.invalidateQueries({ queryKey: ['Transactions.infinite'] });
    },
    onSuccess: (data) => {
      if (data.transferFunds?.success) {
        const fromAcc = accounts.find((a) => a.id === fromAccountId);
        const toAcc   = accounts.find((a) => a.id === toAccountId);
        setLastTransfer({
          amount:   parseFloat(amount),
          fromName: fromAcc?.name ?? fromAccountId,
          toName:   toAcc?.name   ?? toAccountId,
        });
        setStatus('success');
      } else {
        setStatus('error');
        setErrMsg('Transfer failed. Please check your balance.');
      }
    },
    retry: false,
  });

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount   = accounts.find((a) => a.id === toAccountId);
  const amountNum   = parseFloat(amount);
  const isValid =
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    amount &&
    !isNaN(amountNum) &&
    amountNum > 0 &&
    (fromAccount ? amountNum <= fromAccount.balance : true);

  const handleSubmit = () => {
    if (!isValid) return;
    setStatus('pending');
    setErrMsg('');
    transferMutation.mutate({
      fromAccountId,
      toAccountId,
      amount: amountNum,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  const handleReset = () => {
    setFromAccountId('');
    setToAccountId('');
    setAmount('');
    setStatus('idle');
    setErrMsg('');
    setLastTransfer(null);
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Transfer Funds</h1>
        <p className="page-subtitle">Move money between your accounts instantly</p>
        <DemoBadge concepts={[
          { label: 'Optimistic updates & rollback', path: '/adrs/idempotency-and-optimistic-updates' },
          { label: 'Idempotency keys',               path: '/stories/sams-double-transfer' },
        ]} />
      </div>

      <div className="page-body">
        {/* Loading */}
        {accountsLoading && <TransferSkeleton />}

        {/* Accounts error */}
        {!accountsLoading && accountsError && (
          <div className="card" style={{ maxWidth: 520 }}>
            <ErrorCard message={(accountsError as Error).message} onRetry={() => refetch()} />
          </div>
        )}

        {/* Success */}
        {status === 'success' && lastTransfer && (
          <TransferSuccess {...lastTransfer} onReset={handleReset} />
        )}

        {/* Form */}
        {!accountsLoading && !accountsError && status !== 'success' && (
          <div style={{ maxWidth: 520 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">New Transfer</div>
                  <div className="card-subtitle">Transfers are processed immediately</div>
                </div>
              </div>

              <div className="card-body flex-col gap-5">
                {/* From */}
                <div className="form-group">
                  <label className="form-label">From Account</label>
                  <select
                    className="form-control"
                    value={fromAccountId}
                    onChange={(e) => { setFromAccountId(e.target.value); setStatus('idle'); }}
                    disabled={status === 'pending'}
                  >
                    <option value="">Select source account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === toAccountId}>
                        {a.name} · {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                  </select>
                  {fromAccount && (
                    <span className="text-sm text-muted">
                      Available: <strong>{formatCurrency(fromAccount.balance, fromAccount.currency)}</strong>
                    </span>
                  )}
                </div>

                {/* To */}
                <div className="form-group">
                  <label className="form-label">To Account</label>
                  <select
                    className="form-control"
                    value={toAccountId}
                    onChange={(e) => { setToAccountId(e.target.value); setStatus('idle'); }}
                    disabled={status === 'pending'}
                  >
                    <option value="">Select destination account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                        {a.name} · {formatCurrency(a.balance, a.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label className="form-label">Amount (USD)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setStatus('idle'); }}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    disabled={status === 'pending'}
                  />
                  {fromAccount && amountNum > fromAccount.balance && (
                    <span className="text-sm" style={{ color: 'var(--color-danger)' }}>
                      Insufficient balance
                    </span>
                  )}
                </div>

                {/* Transfer preview */}
                {fromAccount && toAccount && amountNum > 0 && !isNaN(amountNum) && amountNum <= fromAccount.balance && (
                  <div style={{
                    background: 'var(--color-brand-light)',
                    border: '1px solid rgba(79,110,247,0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: 'var(--space-3) var(--space-4)',
                    fontSize: 13,
                    color: 'var(--color-brand-dark)',
                  }}>
                    {fromAccount.name} → {toAccount.name} · <strong>{formatCurrency(amountNum)}</strong>
                  </div>
                )}

                {/* Submit */}
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={!isValid || status === 'pending'}
                  style={{ width: '100%', position: 'relative' }}
                >
                  {status === 'pending' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                      <span style={{
                        width: 14, height: 14,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        display: 'inline-block',
                      }} />
                      Processing…
                    </span>
                  ) : 'Transfer Funds'}
                </button>

                {/* Error */}
                {status === 'error' && errMsg && (
                  <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⚠</span>
                    <span>{errMsg}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
