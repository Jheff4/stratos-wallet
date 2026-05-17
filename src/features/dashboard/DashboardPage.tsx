import BalanceTrend from './components/BalanceTrend';
import SpendingChart from './components/SpendingChart';
import PortfolioPie from './components/PortfolioPie';
// import AccountSummary from '@features/accounts/components/AccountSummary';
// import TransactionWidget from '@features/transactions/components/TransactionWidget';

export default function DashboardPage() {
  return (
    <div style={{ padding: '1rem' }}>
      <h1>Financial Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <BalanceTrend walletId="w1" />
        <PortfolioPie walletId="w1" />
        <SpendingChart walletId="w1" />
        {/* <AccountSummary /> */}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {/* <TransactionWidget /> */}
      </div>
    </div>
  );
}