import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '1rem',
        border: '1px solid red',
        borderRadius: '8px',
        background: '#1a1a1a',
      }}
    >
      <h3>Unable to load this section</h3>

      <p>
        Something unexpected happened.
        Your data is safe.
      </p>

      <pre
        style={{
          color: '#ff6b6b',
          overflowX: 'auto',
        }}
      >
        {error.message}
      </pre>

      <button onClick={resetErrorBoundary}>
        Retry
      </button>
    </div>
  );
}

export default function QueryErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const { reset } = useQueryErrorResetBoundary();

  const location = useLocation();

  return (
    <ErrorBoundary
      onReset={reset}
      resetKeys={[location.pathname]}
      onError={(error) => {
        console.error('[ErrorBoundary]', error);
      }}
      FallbackComponent={ErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}