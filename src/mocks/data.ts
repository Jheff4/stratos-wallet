// ============================================================
// Central Ledger & Data Model for Stratos Wallet
// ============================================================
//
// ARCHITECTURE PRINCIPLE: The ledger is the single source of truth.
//
// No balance is stored anywhere. Every number the UI displays (current
// balance, balance history, spending by category) is derived by
// scanning the ledger at query time. This mirrors how real financial
// systems work: your bank stores every debit and credit, then derives
// your balance on demand.
//
// WALLET STORE: A single Map is the only wallet registry.
// There is no separate array, no second copy. Every read and write goes
// through the same structure, making it impossible for two stores to
// drift apart.
//
// ============================================================

import { getUsers } from './auth';

// ------------------------------------------------------------
// Domain Types
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// Single Wallet Registry
//
// WHY A MAP, NOT AN ARRAY:
// A Map<userId, WalletDef[]> gives O(1) lookup by user without
// scanning every wallet on every request. More importantly, it
// makes the ownership relationship explicit: wallets belong to
// users, and the data structure says so.
//
// The seed wallet for the default demo user (u1) is placed here
// at module initialisation, so the first read and every subsequent
// read use the same code path.
// ------------------------------------------------------------

const DEFAULT_WALLET: WalletDef = {
  id: 'w1',
  userId: 'u1',
  label: 'Personal Wallet',
  accounts: [
    { id: 'a1', name: 'Main Checking', type: 'CHECKING', currency: 'USD' },
    { id: 'a2', name: 'Savings',       type: 'SAVINGS',  currency: 'USD' },
  ],
};

// This Map is the one and only wallet store.
// createDefaultWalletForUser writes here.
// getWalletsForUser reads from here.
// computeBalanceHistory reads from here (via getWalletById).
// No other data structure holds wallets.
const walletsByUser = new Map<string, WalletDef[]>([
  ['u1', [DEFAULT_WALLET]],
]);

// ------------------------------------------------------------
// Wallet Access: all callers use these functions
// ------------------------------------------------------------

export function getWalletsForUser(userId: string): WalletDef[] {
  return walletsByUser.get(userId) ?? [];
}

export function getAllWallets(): WalletDef[] {
  const result: WalletDef[] = [];
  for (const wallets of walletsByUser.values()) {
    result.push(...wallets);
  }
  return result;
}

export function getWalletById(walletId: string): WalletDef | undefined {
  for (const wallets of walletsByUser.values()) {
    const found = wallets.find((w) => w.id === walletId);
    if (found) return found;
  }
  return undefined;
}

export function getAccountById(accountId: string): AccountDef | undefined {
  for (const wallets of walletsByUser.values()) {
    for (const wallet of wallets) {
      const found = wallet.accounts.find((a) => a.id === accountId);
      if (found) return found;
    }
  }
  return undefined;
}

export function getAllAccountsForUser(userId: string): AccountDef[] {
  return getWalletsForUser(userId).flatMap((w) => w.accounts);
}

/**
 * Adds a wallet to the store for a given user.
 * Used by mutation handlers so they always write through the
 * single registry rather than a secondary structure.
 */
export function addWallet(userId: string, wallet: WalletDef): void {
  const existing = walletsByUser.get(userId) ?? [];
  walletsByUser.set(userId, [...existing, wallet]);
}

// ------------------------------------------------------------
// Wallet Creation
//
// WHY: When a new user registers, we provision a wallet and an
// initial deposit so the dashboard is not empty on first login.
// The wallet is stored immediately in walletsByUser, the only
// store, so every downstream read path will find it.
// ------------------------------------------------------------

export function createDefaultWalletForUser(userId: string): WalletDef {
  const walletId    = crypto.randomUUID();
  const checkingId  = crypto.randomUUID();
  const savingsId   = crypto.randomUUID();

  const wallet: WalletDef = {
    id: walletId,
    userId,
    label: 'Personal Wallet',
    accounts: [
      { id: checkingId, name: 'Main Checking', type: 'CHECKING', currency: 'USD' },
      { id: savingsId,  name: 'Savings',       type: 'SAVINGS',  currency: 'USD' },
    ],
  };

  // Register in the single wallet store immediately.
  // Without this, every read path would return empty for this user.
  const existing = walletsByUser.get(userId) ?? [];
  walletsByUser.set(userId, [...existing, wallet]);

  // Seed an initial deposit so the new user has a non-zero starting balance.
  ledger.unshift({
    id: crypto.randomUUID(),
    amount: 10_000,
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

// ------------------------------------------------------------
// Session Persistence
//
// Persists to sessionStorage so a page refresh does not reset
// the mock state mid-demo. Uses walletsByUser (the single store)
// for serialisation, no translation layer needed.
// ------------------------------------------------------------

const STORAGE_KEY = 'stratos_wallet_state';

export async function loadState(): Promise<void> {
  const saved = sessionStorage.getItem(STORAGE_KEY);

  if (saved) {
    const data = JSON.parse(saved);

    walletsByUser.clear();
    for (const [userId, wallets] of Object.entries(data.walletsByUser)) {
      walletsByUser.set(userId, wallets as WalletDef[]);
    }

    ledger.length = 0;
    ledger.push(...(data.ledger as LedgerEntry[]));

    const { loadUsers } = await import('./auth');
    loadUsers(data.users ?? []);
  } else {
    const { registerUser } = await import('./auth');
    registerUser('admin@stratos.com', 'admin123', 'admin');
  }
}

export async function saveState(): Promise<void> {
  const state = {
    walletsByUser: Object.fromEntries(walletsByUser),
    ledger,
    users: getUsers(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ------------------------------------------------------------
// Ledger Seed Data
//
// Generates 51 realistic ledger entries (one opening deposit +
// 50 mixed transactions) spread over 30 days for the demo user.
// Entries reference a1 and a2, the accounts in DEFAULT_WALLET.
// ------------------------------------------------------------

const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Transport',
  'Income',
] as const;

const DESCRIPTIONS = [
  'Salary deposit',
  'Grocery store',
  'Online purchase',
  'Electric bill',
  'Movie tickets',
  'Freelance payment',
] as const;

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateInitialLedger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  // Opening balance, always first so computeBalance starts positive.
  entries.push({
    id: 't0',
    amount: 10_000,
    currency: 'USD',
    type: 'DEPOSIT',
    description: 'Initial deposit',
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    sourceAccountId: null,
    destinationAccountId: 'a1',
    category: 'Income',
  });

  for (let i = 1; i <= 50; i++) {
    const isIncome = Math.random() > 0.7;
    const type = isIncome
      ? 'DEPOSIT'
      : Math.random() > 0.5
      ? 'WITHDRAWAL'
      : 'TRANSFER';

    const sourceId = type === 'DEPOSIT' ? null : randomFrom(['a1', 'a2'] as const);
    const destId   = type === 'WITHDRAWAL' ? null : randomFrom(['a1', 'a2'] as const);
    const amount   = Math.round(Math.random() * 500 * 100) / 100;
    const daysAgo  = Math.floor(Math.random() * 30);

    entries.push({
      id: `t${i}`,
      amount,
      currency: 'USD',
      type,
      description: randomFrom(DESCRIPTIONS),
      createdAt: new Date(
        Date.now() - daysAgo * 86_400_000 - Math.random() * 86_400_000,
      ).toISOString(),
      sourceAccountId: sourceId,
      destinationAccountId: destId,
      category:
        type === 'DEPOSIT'
          ? 'Income'
          : randomFrom(CATEGORIES.filter((c) => c !== 'Income')),
    });
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// The ledger: append-only, single source of truth.
export const ledger: LedgerEntry[] = generateInitialLedger();

/**
 * The one door into the ledger. Every new transaction (whether it comes
 * from a transfer mutation or a real-time push over the WebSocket) must
 * be appended here, never by touching `ledger` directly from elsewhere.
 *
 * WHY THIS EXISTS:
 * The live WebSocket transaction feed used to bypass the ledger entirely:
 * it patched the React Query cache directly so a transaction *appeared* in
 * the Activity feed and Transaction History, but `computeBalance()` never
 * saw it, because it never touched this array. Balances silently
 * disagreed with the feed showing them happen, and the phantom entry
 * vanished the moment the transaction list was refetched.
 *
 * A single write function makes that bug structurally impossible: nothing
 * can become "a transaction" in this app without becoming a ledger entry,
 * which every projection (balance, history, spending) reads from.
 */
export function addLedgerEntry(entry: LedgerEntry): LedgerEntry {
  ledger.unshift(entry);
  return entry;
}

// ------------------------------------------------------------
// Derived Projections
//
// These functions derive views from the ledger. They do not read
// from any secondary store. No balance is stored: these compute
// it fresh on every call. In production, a snapshot cache with
// periodic reconciliation would replace the O(n) scan.
// ------------------------------------------------------------

/**
 * Current balance for an account.
 * Credits (destinationAccountId) add to the balance.
 * Debits (sourceAccountId) subtract from the balance.
 */
export function computeBalance(accountId: string): number {
  return ledger.reduce((sum, entry) => {
    if (entry.destinationAccountId === accountId) return sum + entry.amount;
    if (entry.sourceAccountId      === accountId) return sum - entry.amount;
    return sum;
  }, 0);
}

/**
 * Balance history for a wallet over the last N days.
 * For each day, sums all ledger entries up to midnight of that day
 * across every account in the wallet.
 *
 * Uses getWalletById, the single store, so this works for
 * both the demo wallet (w1) and any dynamically created wallet.
 */
export function computeBalanceHistory(
  walletId: string,
  days = 30,
): { date: string; balance: number }[] {
  // Single store lookup, no separate array needed.
  const wallet = getWalletById(walletId);
  if (!wallet) return [];

  const history: { date: string; balance: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const cutoff  = new Date(now.getTime() - i * 86_400_000);
    const dateStr = cutoff.toISOString().slice(0, 10);

    const totalBalance = wallet.accounts.reduce((walletSum, account) => {
      const accountBalance = ledger
        .filter((entry) => new Date(entry.createdAt) <= cutoff)
        .reduce((sum, entry) => {
          if (entry.destinationAccountId === account.id) return sum + entry.amount;
          if (entry.sourceAccountId      === account.id) return sum - entry.amount;
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

/**
 * Spending by category for a wallet over a date range.
 * Only considers withdrawals and transfers (outflows).
 * Deposits are excluded: they are income, not spending.
 *
 * Uses getWalletById, the single store, so this works for
 * both the demo wallet and any dynamically created wallet.
 */
export function computeSpendingByCategory(
  walletId: string,
  startDate: string,
  endDate: string,
): { category: string; amount: number }[] {
  // Single store lookup.
  const wallet = getWalletById(walletId);
  if (!wallet) return [];

  const accountIds = new Set(wallet.accounts.map((a) => a.id));
  const start      = new Date(startDate);
  const end        = new Date(endDate);

  const spendingEntries = ledger.filter((entry) => {
    const date = new Date(entry.createdAt);
    return (
      date >= start &&
      date <= end &&
      entry.sourceAccountId !== null &&
      accountIds.has(entry.sourceAccountId) &&
      entry.type !== 'DEPOSIT'
    );
  });

  const categoryMap = new Map<string, number>();
  for (const entry of spendingEntries) {
    const cat = entry.category ?? 'Uncategorized';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + entry.amount);
  }

  return Array.from(categoryMap.entries()).map(([category, amount]) => ({
    category,
    amount: Math.round(amount * 100) / 100,
  }));
}
