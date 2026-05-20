import { graphql, HttpResponse, http } from 'msw'
import {
  ledger,
  wallets,
  computeBalance,
  computeBalanceHistory,
  computeSpendingByCategory,
  type LedgerEntry,
} from './data'

import { registerUser, authenticateUser, createToken, findUserByEmail } from './auth';
import { applyChaos, updateChaosConfig } from './chaos';

const idempotencyStore = new Map<string, any>()

export const handlers = [
  http.post('/chaos/config', async ({ request }) => {
    const body = await request.json() as any;
    updateChaosConfig(body);
    return HttpResponse.json({ success: true });
  }),

  // Auth endpoints
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
    await applyChaos();
    const result = wallets.map((wallet) => ({
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
    }))

    return HttpResponse.json({
      data: { wallets: result },
    })
  }),

  // ======================================================
  // QUERY: Accounts
  // ======================================================
  graphql.query('Accounts', async ({ variables }) => {
    await applyChaos();
    const { walletId } = variables as { walletId: string }

    const wallet = wallets.find((w) => w.id === walletId)
    if (!wallet) {
      return HttpResponse.json({ data: { accounts: [] } })
    }

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
    })
  }),

  // ======================================================
  // QUERY: Transactions (cursor pagination)
  // ======================================================
  graphql.query('Transactions', async ({ variables }) => {
    await applyChaos();
    const { accountId, first = 10, after } = variables as {
      accountId?: string
      first?: number
      after?: string
    }

    let filtered = [...ledger]

    if (accountId) {
      filtered = filtered.filter(
        (t) =>
          t.sourceAccountId === accountId ||
          t.destinationAccountId === accountId,
      )
    }

    let startIndex = 0

    if (after) {
      const idx = filtered.findIndex((t) => t.id === after)
      if (idx >= 0) startIndex = idx + 1
    }

    const sliced = filtered.slice(startIndex, startIndex + first)

    return HttpResponse.json({
      data: {
        transactions: {
          edges: sliced.map((t) => ({
            node: t,
            cursor: t.id,
          })),
          pageInfo: {
            hasNextPage: startIndex + first < filtered.length,
            endCursor: sliced.length ? sliced[sliced.length - 1].id : null,
          },
        },
      },
    })
  }),

  // ======================================================
  // QUERY: Balance History
  // ======================================================
  graphql.query('BalanceHistory', async ({ variables }) => {
    await applyChaos();
    const { walletId } = variables as { walletId: string }

    return HttpResponse.json({
      data: {
        balanceHistory: computeBalanceHistory(walletId),
      },
    })
  }),

  // ======================================================
  // QUERY: Spending By Category
  // ======================================================
  graphql.query('SpendingByCategory', async ({ variables }) => {
    await applyChaos();
    const { walletId, startDate, endDate } = variables as {
      walletId: string
      startDate: string
      endDate: string
    }

    return HttpResponse.json({
      data: {
        spendingByCategory: computeSpendingByCategory(
          walletId,
          startDate,
          endDate,
        ),
      },
    })
  }),

  // ======================================================
  // MUTATION: Create Wallet
  // ======================================================
  graphql.mutation('CreateWallet', async ({ variables }) => {
    await applyChaos();
    const { label } = variables as { label: string }

    const newWallet = {
      id: `w${Date.now()}`,
      userId: 'u1',
      label,
      accounts: [],
    }

    wallets.push(newWallet)

    return HttpResponse.json({
      data: {
        createWallet: newWallet,
      },
    })
  }),

  // ======================================================
  // MUTATION: Transfer Funds
  // ======================================================
  graphql.mutation('TransferFunds', async ({ variables }) => {
    await applyChaos();
    const {
      fromAccountId,
      toAccountId,
      amount,
      idempotencyKey,
    } = variables as {
      fromAccountId: string
      toAccountId: string
      amount: number
      idempotencyKey: string
    }

    if (idempotencyStore.has(idempotencyKey)) {
      return HttpResponse.json({
        data: {
          transferFunds: idempotencyStore.get(idempotencyKey),
        },
      })
    }

    const fromAccount = wallets
      .flatMap((w) => w.accounts)
      .find((a) => a.id === fromAccountId)

    const toAccount = wallets
      .flatMap((w) => w.accounts)
      .find((a) => a.id === toAccountId)

    if (!fromAccount || !toAccount) {
      const res = { success: false, transaction: null }

      idempotencyStore.set(idempotencyKey, res)

      return HttpResponse.json({
        data: { transferFunds: res },
      })
    }

    const newTransaction: LedgerEntry = {
      id: `t${Date.now()}`,
      amount,
      currency: fromAccount.currency,
      type: 'TRANSFER',
      description: `Transfer to ${toAccount.name}`,
      createdAt: new Date().toISOString(),
      sourceAccountId: fromAccountId,
      destinationAccountId: toAccountId,
      category: 'Transfer',
    }

    ledger.unshift(newTransaction)

    const res = {
      success: true,
      transaction: newTransaction,
    }

    idempotencyStore.set(idempotencyKey, res)

    return HttpResponse.json({
      data: { transferFunds: res },
    })
  }),
]