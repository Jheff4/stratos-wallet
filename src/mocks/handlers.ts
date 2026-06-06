import { graphql, HttpResponse, http } from 'msw';
import {
  ledger,
  getAllWallets,
  getWalletById,
  getAccountById,
  addWallet,
  computeBalance,
  computeBalanceHistory,
  computeSpendingByCategory,
  type LedgerEntry,
  type WalletDef,
} from './data';

import { registerUser, authenticateUser, createToken, findUserByEmail } from './auth';
import { applyChaos, updateChaosConfig } from './chaos';

const idempotencyStore = new Map<string, any>();

export const handlers = [
  // ======================================================
  // Chaos config endpoint (no chaos applied here)
  // ======================================================
  http.post('/chaos/config', async ({ request }) => {
    const body = await request.json() as any;
    updateChaosConfig(body);
    return HttpResponse.json({ success: true });
  }),

  // ======================================================
  // Auth
  // ======================================================
  http.post('/auth/register', async ({ request }) => {
    const { email, password, role } = await request.json() as any;
    if (!email || !password) return new HttpResponse(null, { status: 400 });
    if (findUserByEmail(email)) {
      return HttpResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    const user = registerUser(email, password, role || 'user');
    const token = createToken(user);
    return HttpResponse.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  }),

  http.post('/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as any;
    const user = authenticateUser(email, password);
    if (!user) return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = createToken(user);
    return HttpResponse.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  }),

  // ======================================================
  // QUERY: Wallets
  // ======================================================
  graphql.query('Wallets', async () => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const result = getAllWallets().map((wallet) => ({
      id: wallet.id,
      label: wallet.label,
      accounts: wallet.accounts.map((acc) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        balance: computeBalance(acc.id),
        currency: acc.currency,
        lastUpdated: new Date().toISOString(),
      })),
    }));

    return HttpResponse.json({ data: { wallets: result } });
  }),

  // ======================================================
  // QUERY: Accounts
  // ======================================================
  graphql.query('Accounts', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { walletId } = variables as { walletId: string };
    const wallet = getWalletById(walletId);
    if (!wallet) return HttpResponse.json({ data: { accounts: [] } });

    return HttpResponse.json({
      data: {
        accounts: wallet.accounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          balance: computeBalance(acc.id),
          currency: acc.currency,
          lastUpdated: new Date().toISOString(),
        })),
      },
    });
  }),

  // ======================================================
  // QUERY: Transactions (cursor pagination)
  // ======================================================
  graphql.query('Transactions', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { accountId, first = 10, after } = variables as {
      accountId?: string;
      first?: number;
      after?: string;
    };

    let filtered = [...ledger];

    if (accountId) {
      filtered = filtered.filter(
        (t) => t.sourceAccountId === accountId || t.destinationAccountId === accountId,
      );
    }

    let startIndex = 0;
    if (after) {
      const idx = filtered.findIndex((t) => t.id === after);
      if (idx >= 0) startIndex = idx + 1;
    }

    const sliced = filtered.slice(startIndex, startIndex + first);

    return HttpResponse.json({
      data: {
        transactions: {
          totalCount: filtered.length,
          edges: sliced.map((t) => ({ node: t, cursor: t.id })),
          pageInfo: {
            hasNextPage: startIndex + first < filtered.length,
            endCursor: sliced.length ? sliced[sliced.length - 1].id : null,
          },
        },
      },
    });
  }),

  // ======================================================
  // QUERY: Balance History
  // ======================================================
  graphql.query('BalanceHistory', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { walletId } = variables as { walletId: string };
    return HttpResponse.json({
      data: { balanceHistory: computeBalanceHistory(walletId) },
    });
  }),

  // ======================================================
  // QUERY: Spending By Category
  // ======================================================
  graphql.query('SpendingByCategory', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { walletId, startDate, endDate } = variables as {
      walletId: string;
      startDate: string;
      endDate: string;
    };

    return HttpResponse.json({
      data: { spendingByCategory: computeSpendingByCategory(walletId, startDate, endDate) },
    });
  }),

  // ======================================================
  // MUTATION: Create Wallet
  // ======================================================
  graphql.mutation('CreateWallet', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { label } = variables as { label: string };

    const newWallet: WalletDef = {
      id: `w${Date.now()}`,
      userId: 'u1',
      label,
      accounts: [],
    };

    addWallet('u1', newWallet);

    return HttpResponse.json({ data: { createWallet: newWallet } });
  }),

  // ======================================================
  // MUTATION: Transfer Funds
  // ======================================================
  graphql.mutation('TransferFunds', async ({ variables }) => {
    const chaos = await applyChaos();
    if (chaos) return chaos;

    const { fromAccountId, toAccountId, amount, idempotencyKey } = variables as {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      idempotencyKey: string;
    };

    if (idempotencyStore.has(idempotencyKey)) {
      return HttpResponse.json({ data: { transferFunds: idempotencyStore.get(idempotencyKey) } });
    }

    const fromAccount = getAccountById(fromAccountId);
    const toAccount   = getAccountById(toAccountId);

    if (!fromAccount || !toAccount) {
      const res = { success: false, transaction: null };
      idempotencyStore.set(idempotencyKey, res);
      return HttpResponse.json({ data: { transferFunds: res } });
    }

    const newTransaction: LedgerEntry = {
      id:                   `t${Date.now()}`,
      amount,
      currency:             fromAccount.currency,
      type:                 'TRANSFER',
      description:          `Transfer to ${toAccount.name}`,
      createdAt:            new Date().toISOString(),
      sourceAccountId:      fromAccountId,
      destinationAccountId: toAccountId,
      category:             'Transfer',
    };

    ledger.unshift(newTransaction);

    const res = { success: true, transaction: newTransaction };
    idempotencyStore.set(idempotencyKey, res);

    return HttpResponse.json({ data: { transferFunds: res } });
  }),
];
