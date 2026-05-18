// ============================================================
// Central Ledger & Data Model for Stratos Wallet
// ============================================================
// The ledger is the single source of truth for all financial data.
// Balances, transaction history, charts, and analytics are all
// computed from this append-only array of entries.

import { getUsers } from './auth';

export interface LedgerEntry {
  id: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  description: string;
  createdAt: string;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  category?: string;
}

export interface AccountDef {
  id: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  currency: string;
}

export interface WalletDef {
  id: string;
  userId: string;
  label: string;
  accounts: AccountDef[];
}

// -- Wallet definitions (structure, not balances) --
export const wallets: WalletDef[] = [
  {
    id: 'w1',
    userId: 'u1',
    label: 'Personal Wallet',
    accounts: [
      { id: 'a1', name: 'Main Checking', type: 'CHECKING', currency: 'USD' },
      { id: 'a2', name: 'Savings', type: 'SAVINGS', currency: 'USD' },
    ],
  },
];

// export interface WalletDef { id: string; userId: string; label: string; accounts: AccountDef[]; }

const walletsByUser = new Map<string, WalletDef[]>();

export function createDefaultWalletForUser(userId: string): WalletDef {
  const walletId = crypto.randomUUID();
  const checkingId = crypto.randomUUID();
  const savingsId = crypto.randomUUID();
  const wallet: WalletDef = {
    id: walletId,
    userId,
    label: 'Personal Wallet',
    accounts: [
      { id: checkingId, name: 'Main Checking', type: 'CHECKING', currency: 'USD' },
      { id: savingsId, name: 'Savings', type: 'SAVINGS', currency: 'USD' },
    ],
  };
  // Add initial deposit transaction
  ledger.unshift({
    id: crypto.randomUUID(),
    amount: 10000,
    currency: 'USD',
    type: 'DEPOSIT',
    description: 'Initial deposit',
    createdAt: new Date().toISOString(),
    sourceAccountId: null,
    destinationAccountId: checkingId,
    category: 'Income',
  });
  return wallet;
}

// Load/save from sessionStorage for persistence
const STORAGE_KEY = 'stratos_wallet_state';

export async function loadState() {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    // Restore walletsByUser
    walletsByUser.clear();
    for (const [userId, wallets] of Object.entries(data.walletsByUser)) {
      walletsByUser.set(userId, wallets as WalletDef[]);
    }
    // Restore ledger
    ledger.length = 0;
    ledger.push(...data.ledger as LedgerEntry[]);
    // Restore users
    const { loadUsers } = await import('./auth');
    loadUsers(data.users || []);
  } else {
    // Seed default admin user
    const { registerUser } = await import('./auth');
    registerUser('admin@stratos.com', 'admin123', 'admin');
  }
}

export async function saveState() {
  const state = {
    walletsByUser: Object.fromEntries(walletsByUser),
    ledger,
    users: getUsers(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Functions to get wallets/accounts for a user
export function getWalletsForUser(userId: string): WalletDef[] {
  return walletsByUser.get(userId) || [];
}

export function getAllAccountsForUser(userId: string): AccountDef[] {
  const wallets = getWalletsForUser(userId);
  return wallets.flatMap(w => w.accounts);
}

export function getWalletById(walletId: string): WalletDef | undefined {
  for (const wallets of walletsByUser.values()) {
    const found = wallets.find(w => w.id === walletId);
    if (found) return found;
  }
  return undefined;
}

export function getAccountById(accountId: string): AccountDef | undefined {
  for (const wallets of walletsByUser.values()) {
    for (const w of wallets) {
      const found = w.accounts.find(a => a.id === accountId);
      if (found) return found;
    }
  }
  return undefined;
}

// -- Helpers --
const categories = [
  'Food & Dining',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Transport',
  'Income',
];
const descriptions = [
  'Salary deposit',
  'Grocery store',
  'Online purchase',
  'Electric bill',
  'Movie tickets',
  'Freelance payment',
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInitialLedger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  // Starting deposit
  entries.push({
    id: 't0',
    amount: 10000,
    currency: 'USD',
    type: 'DEPOSIT',
    description: 'Initial deposit',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    sourceAccountId: null,
    destinationAccountId: 'a1',
    category: 'Income',
  });

  // 50 random transactions over 30 days
  for (let i = 1; i <= 50; i++) {
    const isIncome = Math.random() > 0.7;
    const type = isIncome
      ? 'DEPOSIT'
      : Math.random() > 0.5
      ? 'WITHDRAWAL'
      : 'TRANSFER';
    const sourceId = type === 'DEPOSIT' ? null : randomFrom(['a1', 'a2']);
    const destId = type === 'WITHDRAWAL' ? null : randomFrom(['a1', 'a2']);
    const amount = Math.round(Math.random() * 500 * 100) / 100;
    const daysAgo = Math.floor(Math.random() * 30);
    entries.push({
      id: `t${i}`,
      amount,
      currency: 'USD',
      type,
      description: randomFrom(descriptions),
      createdAt: new Date(
        Date.now() - daysAgo * 86400000 - Math.random() * 86400000,
      ).toISOString(),
      sourceAccountId: sourceId,
      destinationAccountId: destId,
      category:
        type === 'DEPOSIT'
          ? 'Income'
          : randomFrom(categories.filter((c) => c !== 'Income')),
    });
  }

  return entries.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// The ledger – source of truth
export const ledger: LedgerEntry[] = generateInitialLedger();

// Compute current balance for an account
export function computeBalance(accountId: string): number {
  return ledger.reduce((sum, entry) => {
    if (entry.destinationAccountId === accountId) return sum + entry.amount;
    if (entry.sourceAccountId === accountId) return sum - entry.amount;
    return sum;
  }, 0);
}

// Compute balance history for a wallet (sum of its accounts) over N days
export function computeBalanceHistory(
  walletId: string,
  days = 30,
): { date: string; balance: number }[] {
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return [];

  const history: { date: string; balance: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 86400000);
    const dateStr = date.toISOString().slice(0, 10);

    const totalBalance = wallet.accounts.reduce((walletSum, account) => {
      const accountBalance = ledger
        .filter((entry) => new Date(entry.createdAt) <= date)
        .reduce((sum, entry) => {
          if (entry.destinationAccountId === account.id) return sum + entry.amount;
          if (entry.sourceAccountId === account.id) return sum - entry.amount;
          return sum;
        }, 0);
      return walletSum + accountBalance;
    }, 0);

    history.push({
      date: dateStr,
      balance: Math.round(totalBalance * 100) / 100,
    });
  }

  return history;
}

// Compute spending by category for a wallet over a date range
export function computeSpendingByCategory(
  walletId: string,
  startDate: string,
  endDate: string,
): { category: string; amount: number }[] {
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return [];

  const accountIds = wallet.accounts.map((a) => a.id);
  const start = new Date(startDate);
  const end = new Date(endDate);

  const spendingEntries = ledger.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date >= start &&
      date <= end &&
      entry.sourceAccountId !== null &&
      accountIds.includes(entry.sourceAccountId) &&
      entry.type !== 'DEPOSIT'
    );
  });

  const categoryMap = new Map<string, number>();
  spendingEntries.forEach((entry) => {
    const cat = entry.category || 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + entry.amount);
  });

  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }));
}