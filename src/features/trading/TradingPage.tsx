import DemoBadge from '@shared/components/DemoBadge';

// Not linked from the sidebar yet, reachable only by direct URL. Kept as an
// honest placeholder rather than deleted, since real-time trading UI (order
// book, live price ticks) is a natural extension of the existing WebSocket
// reliability protocol once accounts support tradable instruments.
export function TradingPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Trading</h1>
        <p className="page-subtitle">Not built yet</p>
        <DemoBadge stub concepts={[]} />
      </div>
    </>
  );
}

export default TradingPage;
