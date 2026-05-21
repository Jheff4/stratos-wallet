import BalanceTrend from './components/BalanceTrend';
import SpendingChart from './components/SpendingChart';
import PortfolioPie from './components/PortfolioPie';
import QueryErrorBoundary from '@shared/components/QueryErrorBoundary';
// import AccountSummary from '@features/accounts/components/AccountSummary';
// import TransactionWidget from '@features/transactions/components/TransactionWidget';

export default function DashboardPage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Financial Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <QueryErrorBoundary>
          <BalanceTrend walletId="w1" />
        </QueryErrorBoundary>

        <QueryErrorBoundary>
          <PortfolioPie walletId="w1" />
        </QueryErrorBoundary>
        
        <QueryErrorBoundary>
          <SpendingChart walletId="w1" />
        </QueryErrorBoundary>
        {/* <AccountSummary /> */}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {/* <TransactionWidget /> */}
      </div>
    </div>
  );
}