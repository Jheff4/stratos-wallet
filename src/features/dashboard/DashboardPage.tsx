import BalanceTrend from './components/BalanceTrend';
import SpendingChart from './components/SpendingChart';
import PortfolioPie from './components/PortfolioPie';
import QueryErrorBoundary from '@shared/components/QueryErrorBoundary';

export default function DashboardPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Your financial overview at a glance</p>
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
