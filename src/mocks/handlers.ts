import { graphql, HttpResponse } from 'msw';
import { mockWallets } from './data';

const idempotencyStore = new Map<string, any>();

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
  graphql.query('Transactions', () => {
    return HttpResponse.json({
      data: {
        transactions: {
          edges: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      },
    });
  }),

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
    const result = {
      data: {
        transferFunds: {
          success: true,
          transaction: {
            id: `t${Date.now()}`,
            amount,
            currency: 'USD',
            type: 'TRANSFER',
            description: `Transfer of ${amount}`,
            createdAt: new Date().toISOString(),
            sourceAccountId: fromAccountId,
            destinationAccountId: toAccountId,
          },
        },
      },
    };
    if (idempotencyKey) {
      idempotencyStore.set(idempotencyKey, result);
    }
    return HttpResponse.json(result);
  }),
];
