import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { routes } from './routing'
import { useTransactionSubscription } from '@shared/hooks/useTransactionSubscription';

function App() {
  useTransactionSubscription();
  return (
    <BrowserRouter>
      <nav>
        {routes.map((route) => (
          <Link key={route.path} to={route.path}>
            {route.label}
          </Link>
        ))}
      </nav>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </BrowserRouter>
  )
}

export default App
