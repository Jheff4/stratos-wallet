import { graphql, HttpResponse } from 'msw'
import {
  ledger,
  wallets,
  computeBalance,
  computeBalanceHistory,
  computeSpendingByCategory,
  type LedgerEntry,
} from './data'

const idempotencyStore = new Map<string, any>()

export const handlers = [
  // ======================================================
  // QUERY: Wallets
  // ======================================================
  graphql.query('Wallets', () => {
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
  graphql.query('Accounts', ({ variables }) => {
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
  graphql.query('Transactions', ({ variables }) => {
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
  graphql.query('BalanceHistory', ({ variables }) => {
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
  graphql.query('SpendingByCategory', ({ variables }) => {
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
  graphql.mutation('CreateWallet', ({ variables }) => {
    const { label } = variables as { label: string }

    const newWallet = {
      id: `w${Date.now()}`,
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
  graphql.mutation('TransferFunds', ({ variables }) => {
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