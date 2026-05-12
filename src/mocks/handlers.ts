import { graphql, HttpResponse } from 'msw';
import { mockWallets } from './data';

export const handlers = [
  // Query: wallets
  graphql.query('Wallets', () => {
    return HttpResponse.json({
      data: { wallets: mockWallets },
    });
  }),

  // Query: accounts
  graphql.query('Accounts', ({ variables }) => {
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
  graphql.mutation('CreateWallet', ({ variables }) => {
    const newWallet = { id: `w${Date.now()}`, label: variables.label, accounts: [] };
    mockWallets.push(newWallet);
    return HttpResponse.json({ data: { createWallet: newWallet } });
  }),

  // Mutation: transferFunds
  graphql.mutation('TransferFunds', ({ variables }) => {
    const { fromAccountId, amount } = variables;
    // Find account and deduct (mock)
    const wallet = mockWallets[0];
    const account = wallet.accounts.find(a => a.id === fromAccountId);
    if (account) account.balance -= amount;
    return HttpResponse.json({
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
            destinationAccountId: variables.toAccountId,
          },
        },
      },
    });
  }),
];
