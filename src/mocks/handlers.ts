import { graphql, HttpResponse } from 'msw';
import { mockWallets } from './data';
import type { TransferFundsMutation } from '@graphql/generated';

type MockTransaction = {
  id: string;
  amount: number;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  description: string;
  createdAt: string;
  sourceAccountId: string;
  destinationAccountId: string;
};

const idempotencyStore = new Map<string, TransferFundsMutation>();

// Generate 50 mock transactions for pagination testing
function generateMockTransactions() {
  const transactions: MockTransaction[] = [];
  const types = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'] as const;
  const descriptions = ['Salary deposit', 'ATM withdrawal', 'Transfer to savings', 'Online purchase', 'Interest payment'];
  for (let i = 0; i < 50; i++) {
    transactions.push({
      id: `t${i}`,
      amount: Math.round(Math.random() * 1000 * 100) / 100,
      currency: 'USD',
      type: types[Math.floor(Math.random() * types.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(), // one per hour
      sourceAccountId: `a${Math.random() > 0.5 ? 1 : 2}`,
      destinationAccountId: `a${Math.random() > 0.5 ? 2 : 1}`,
    });
  }
  return transactions;
}

const allTransactions = generateMockTransactions();

export const handlers = [
  // Query: wallets
  graphql.query('Wallets', () => {
    return HttpResponse.json({
      data: { wallets: mockWallets },
    });
  }),

  // Query: accounts
  graphql.query('Accounts', ({ variables }: { variables: { walletId: string } }) => {
    const { walletId } = variables;
    const wallet = mockWallets.find(w => w.id === walletId);
    return HttpResponse.json({
      data: { accounts: wallet?.accounts || [] },
    });
  }),

  // Query: transactions (simplified for now)
  graphql.query(
    'Transactions',
    ({
      variables,
    }: {
      variables: { accountId?: string; first?: number; after?: string | null };
    }) => {
      const { accountId, first = 10, after } = variables;

      // Filter by account if provided
      let filtered = allTransactions;
      if (accountId) {
        filtered = allTransactions.filter(
          (t) => t.sourceAccountId === accountId || t.destinationAccountId === accountId,
        );
      }

      // Cursor pagination
      let startIndex = 0;
      if (after) {
        const afterIndex = filtered.findIndex((t) => t.id === after);
        if (afterIndex >= 0) startIndex = afterIndex + 1;
      }
      const sliced = filtered.slice(startIndex, startIndex + first);
      const endCursor = sliced.length > 0 ? sliced[sliced.length - 1].id : null;
      const hasNextPage = startIndex + first < filtered.length;

      return HttpResponse.json({
        data: {
          transactions: {
            edges: sliced.map((t) => ({
              node: t,
              cursor: t.id,
            })),
            pageInfo: {
              hasNextPage,
              endCursor,
            },
          },
        },
      });
    },
  ),

  // Mutation: createWallet
  graphql.mutation('CreateWallet', ({ variables }: { variables: { label: string } }) => {
    const newWallet = { id: `w${Date.now()}`, label: variables.label, accounts: [] };
    mockWallets.push(newWallet);
    return HttpResponse.json({ data: { createWallet: newWallet } });
  }),

  // Mutation: transferFunds
  graphql.mutation('TransferFunds', ({ variables }: { variables: { fromAccountId: string; toAccountId: string; amount: number; idempotencyKey?: string } }) => {
    const { fromAccountId, toAccountId, amount, idempotencyKey } = variables;
    // Check idempotency
    if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
      return HttpResponse.json({ data: idempotencyStore.get(idempotencyKey) });
    }
    // Find account and deduct (mock)
    const wallet = mockWallets[0];
    const senderAccount = wallet.accounts.find(a => a.id === fromAccountId);
    const receiverAccount = wallet.accounts.find(a => a.id === toAccountId);
    
    if (senderAccount) {
      senderAccount.balance -= amount;
    }
    if (receiverAccount) {
      receiverAccount.balance += amount;
    }
    const result: TransferFundsMutation = {
      transferFunds: {
        success: true,
        transaction: {
          id: `t${Date.now()}`,
          amount,
          currency: 'USD',
          createdAt: new Date().toISOString(),
        },
      },
    };
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, result);
    }
    return HttpResponse.json({ data: result });
  }),
];
