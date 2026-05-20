import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ChaosProvider } from './chaos/ChaosContext';
import ChaosPanel from './chaos/ChaosPanel';

async function enableMocking() {
  if (import.meta.env.MODE !== 'development') return;
  const { worker } = await import('./mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ChaosProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <ChaosPanel />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ChaosProvider>
    </React.StrictMode>,
  );
});
