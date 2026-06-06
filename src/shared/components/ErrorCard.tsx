function friendlyMessage(raw?: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  const msg = raw.toLowerCase();
  if (msg.includes('chaos') || msg.includes('simulated')) return 'A fault was injected by the Chaos Console.';
  if (msg.includes('503') || msg.includes('service unavailable')) return 'The server is temporarily unavailable.';
  if (msg.includes('500') || msg.includes('http 500')) return 'A server error occurred. Please try again.';
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Unable to reach the server. Check your connection.';
  if (msg.includes('timeout')) return 'The request took too long. Please try again.';
  if (msg.includes('401') || msg.includes('unauthorized')) return 'Your session has expired. Please sign in again.';
  if (msg.includes('partial')) return 'Only part of this data loaded successfully.';
  return 'Something went wrong loading this data. Please try again.';
}

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
  chaos?: boolean;
}

/**
 * Inline error state for query errors inside a card.
 * Use this when you have isError from React Query.
 * For React Error Boundary fallbacks, use QueryErrorBoundary.
 */
export default function ErrorCard({ message, onRetry, chaos }: ErrorCardProps) {
  const isChaos = chaos || message?.toLowerCase().includes('chaos') || message?.toLowerCase().includes('simulated');

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-10) var(--space-8)',
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <div style={{
        width: 48, height: 48,
        borderRadius: 'var(--radius-md)',
        background: 'var(--color-danger-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {isChaos ? '⚡' : '⚠'}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {isChaos ? 'Chaos fault injected' : 'Unable to load'}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--color-text-muted)', marginTop: 4, maxWidth: 340 }}>
          {friendlyMessage(message)}
        </div>
      </div>

      {onRetry && (
        <button className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
