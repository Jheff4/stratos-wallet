import { useAppStore, type LiveEvent } from '../../store';
import { formatCurrency } from '@shared/utils/formatters';
import DemoBadge from '@shared/components/DemoBadge';

function eventLabel(type: string) {
  switch (type) {
    case 'new_transaction': return { label: 'Transaction',    cls: 'badge-info'    };
    case 'connected':       return { label: 'Connected',      cls: 'badge-success' };
    case 'replay_complete': return { label: 'Replay',         cls: 'badge-neutral' };
    case 'pong':            return { label: 'Pong',           cls: 'badge-neutral' };
    default:                return { label: type,             cls: 'badge-neutral' };
  }
}

function EventRow({ event }: { event: LiveEvent }) {
  const { label, cls } = eventLabel(event.type);
  const tx = event.type === 'new_transaction'
    ? (event.payload as any).transaction
    : null;

  return (
    <tr>
      <td style={{ width: 60, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        #{event.seq}
      </td>
      <td>
        <span className={`badge ${cls}`}>{label}</span>
        {event.replayed && (
          <span className="badge badge-warning" style={{ marginLeft: 4 }}>replayed</span>
        )}
      </td>
      <td>
        {tx ? (
          <div>
            <div className="font-semibold" style={{ fontSize: 13 }}>{tx.description}</div>
            <div className="text-sm text-muted">{tx.sourceAccountId} → {tx.destinationAccountId}</div>
          </div>
        ) : (
          <span className="text-muted text-sm">-</span>
        )}
      </td>
      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        {tx ? (
          <span className={tx.type === 'DEPOSIT' ? 'amount-positive' : 'amount-negative'}>
            {tx.type === 'DEPOSIT' ? '+' : '−'}{formatCurrency(tx.amount, tx.currency)}
          </span>
        ) : null}
      </td>
      <td className="text-sm text-muted" style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
        {new Date(event.receivedAt).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        })}
      </td>
    </tr>
  );
}

export default function ActivityPage() {
  const events      = useAppStore((s) => s.events);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const wsStatus    = useAppStore((s) => s.wsStatus);

  const wsColors: Record<string, string> = {
    connected:    'var(--color-success)',
    reconnecting: 'var(--color-warning)',
    connecting:   'var(--color-warning)',
    disconnected: 'var(--color-danger)',
  };

  return (
    <>
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Live Activity</h1>
            <p className="page-subtitle">
              Real-time WebSocket event stream · {events.length} events this session
            </p>
            <DemoBadge concepts={[
              { label: 'Sequence numbers & gap detection', path: '/stories/azeez-in-the-tunnel' },
              { label: 'Deduplication by eventId',         path: '/stories/jons-duplicate-feed' },
              { label: 'Backoff & reconnect',              path: '/stories/the-reconnect-storm' },
            ]} />
          </div>
          <div className="flex items-center gap-4">
            {/* WS status pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 12px',
              fontSize: 12, fontWeight: 500,
              color: wsColors[wsStatus] ?? 'var(--color-text-muted)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: wsColors[wsStatus],
                boxShadow: wsStatus === 'connected' ? `0 0 5px ${wsColors[wsStatus]}` : 'none',
              }} />
              {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
            </div>

            {events.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Event Stream</div>
              <div className="card-subtitle">
                New events appear at the top · seq = server sequence number
              </div>
            </div>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 28 }}>📡</div>
              <p className="empty-state-text">
                Waiting for events… Make sure the WebSocket server is running.
              </p>
              <code style={{
                marginTop: 8, fontSize: 12,
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg)',
                padding: '4px 10px',
                borderRadius: 4,
              }}>
                cd server && pnpm dev
              </code>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Type</th>
                    <th>Details</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'right' }}>Received</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <EventRow key={event.id + event.seq} event={event} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
