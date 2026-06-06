import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { routes } from './routing';
import { useTransactionSubscription } from '@shared/hooks/useTransactionSubscription';
import Layout from '@shared/components/Layout';
import ChaosPanel from './chaos/ChaosPanel';
import { ToastContainer } from '@shared/components/Toast';

function AppInner() {
  // This must be inside BrowserRouter (uses router context internally via store).
  // It wires WS → query cache + store + toasts.
  useTransactionSubscription();

  return (
    <>
      <Layout>
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </Layout>

      {/* Chaos panel: slides in from bottom-right, driven by store */}
      <ChaosPanel />

      {/* Toast notifications: top-right */}
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
