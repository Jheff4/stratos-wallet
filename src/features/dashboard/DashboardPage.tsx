import BalanceTrend from './components/BalanceTrend';
import SpendingChart from './components/SpendingChart';
import PortfolioPie from './components/PortfolioPie';
import QueryErrorBoundary from '@shared/components/QueryErrorBoundary';
import DemoBadge from '@shared/components/DemoBadge';

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your financial overview at a glance</p>
        <DemoBadge concepts={[
          { label: 'Ledger-first data model',  path: '/adrs/ledger-first-data-model' },
          { label: 'React Query cache design', path: '/adrs/state-management' },
        ]} />
      </div>

      <div className="page-body flex-col gap-5">
        {/* Top row: balance + portfolio */}
        <div className="grid-2">
          <QueryErrorBoundary>
            <BalanceTrend walletId="w1" />
          </QueryErrorBoundary>
          <QueryErrorBoundary>
            <PortfolioPie walletId="w1" />
          </QueryErrorBoundary>
        </div>

        {/* Bottom row: spending */}
        <QueryErrorBoundary>
          <SpendingChart walletId="w1" />
        </QueryErrorBoundary>
      </div>
    </>
  );
}
