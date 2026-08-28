import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

// `error` is typed `unknown`, not `Error`, on purpose: this matches
// react-error-boundary's FallbackProps and the reality of JavaScript: you can
// `throw` anything (a string, an object, undefined). With strict mode's
// useUnknownInCatchVariables, the compiler forces us to prove what we caught
// before touching `.message`. Assuming `error: Error` is a lie that crashes the
// error UI itself the day a non-Error value is thrown.
interface ErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

// Narrow an unknown thrown value to a displayable message. This is the single
// choke point where `unknown` becomes a `string`, everything downstream is safe.
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Interview defense:
// "Two type-safety decisions meet here. First, error boundaries receive `unknown`,
//  not `Error`, because in JS you can throw anything, so I narrow once in
//  `toMessage` and the UI never assumes a shape it can't prove. Second, our
//  GraphQL hooks used to type `.error` as `unknown` too, which doesn't just force
//  casts, it silently poisons JSX, because `unknown && <div/>` is `unknown`,
//  which isn't a valid ReactNode. I fixed that at the source by setting
//  `errorType: 'Error'` in codegen, so every query/mutation across the app gets
//  typed errors from one config line instead of per-call casts. That's the
//  difference between patching symptoms and fixing the contract."

function friendlyMessage(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('chaos') || msg.includes('simulated')) return 'A fault was injected by the Chaos Console.';
  if (msg.includes('503') || msg.includes('service unavailable')) return 'The server is temporarily unavailable. Please try again.';
  if (msg.includes('500') || msg.includes('internal server')) return 'Something went wrong on the server. Our team has been notified.';
  if (msg.includes('network') || msg.includes('failed to fetch')) return 'Unable to reach the server. Check your connection and try again.';
  if (msg.includes('timeout')) return 'The request took too long. Please try again.';
  if (msg.includes('unauthorized') || msg.includes('401')) return 'Your session has expired. Please sign in again.';
  return 'Something went wrong loading this section. Please try again.';
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const message = toMessage(error);
  const isChaos = message.toLowerCase().includes('chaos') ||
                  message.toLowerCase().includes('simulated');

  return (
    <div role="alert" className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
      <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--color-danger-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            {isChaos ? '⚡' : '⚠'}
          </div>
          <div>
            <div className="card-title" style={{ color: 'var(--color-danger)' }}>
              {isChaos ? 'Chaos fault injected' : 'Unable to load'}
            </div>
            <div className="card-subtitle">{friendlyMessage(message)}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={resetErrorBoundary}>
          Try again
        </button>
      </div>
    </div>
  );
}

export default function QueryErrorBoundary({ children }: { children: ReactNode }) {
  const { reset } = useQueryErrorResetBoundary();
  const location  = useLocation();

  return (
    <ErrorBoundary
      onReset={reset}
      resetKeys={[location.pathname]}
      onError={(error) => console.error('[ErrorBoundary]', error)}
      FallbackComponent={ErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}
