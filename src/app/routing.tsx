import type { ReactNode } from 'react'
import AccountListPage from '@features/accounts/AccountListPage'
import LoginPage from '@features/auth/LoginPage'
import DashboardPage from '@features/dashboard/DashboardPage'
import TradingPage from '@features/trading/TradingPage'
import TransactionHistoryPage from '@features/transactions/TransactionHistoryPage'
import WalletsPage from '@features/wallets/WalletsPage';

export type AppRoute = {
  path: string
  label: string
  element: ReactNode
  requiresAuth?: boolean
}

export const routes = [
  {
    path: '/',
    label: 'Dashboard',
    element: <DashboardPage />,
    requiresAuth: true,
  },
  {
    path: '/accounts',
    label: 'Accounts',
    element: <AccountListPage />,
    requiresAuth: true,
  },
  {
    path: '/transactions',
    label: 'Transactions',
    element: <TransactionHistoryPage />,
    requiresAuth: true,
  },
  {
    path: '/trading',
    label: 'Trading',
    element: <TradingPage />,
    requiresAuth: true,
  },
  {
    path: '/wallets',
    label: 'Wallets',
    element: <WalletsPage />,
    requiresAuth: true,
  },
  {
    path: '/login',
    label: 'Login',
    element: <LoginPage />,
  },
] satisfies AppRoute[]
