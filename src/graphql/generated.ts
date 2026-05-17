/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
const TypedDocumentString = String as unknown as { new <TData = unknown, TVariables = unknown>(source: string): string & { __apiType?: TData; __variablesType?: TVariables } }

function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch('/graphql' as string, {
    method: "POST",
    ...({"headers":{"Content-Type":"application/json"}}),
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}
export type AccountType =
  | 'CHECKING'
  | 'INVESTMENT'
  | 'SAVINGS';

export type TransactionType =
  | 'DEPOSIT'
  | 'TRANSFER'
  | 'WITHDRAWAL';

export type AccountsQueryVariables = Exact<{
  walletId: string | number;
}>;


export type AccountsQuery = { accounts: Array<{ id: string, name: string, type: AccountType, balance: number, currency: string, lastUpdated: string }> };

export type BalanceHistoryQueryVariables = Exact<{
  walletId: string | number;
}>;


export type BalanceHistoryQuery = { balanceHistory: Array<{ date: string, balance: number }> };

export type SpendingByCategoryQueryVariables = Exact<{
  walletId: string | number;
  startDate: string;
  endDate: string;
}>;


export type SpendingByCategoryQuery = { spendingByCategory: Array<{ category: string, amount: number }> };

export type TransactionsQueryVariables = Exact<{
  accountId?: string | number | null | undefined;
  first?: number | null | undefined;
  after?: string | null | undefined;
}>;


export type TransactionsQuery = { transactions: { edges: Array<{ cursor: string, node: { id: string, amount: number, currency: string, type: TransactionType, description: string, createdAt: string, sourceAccountId: string, destinationAccountId: string } }>, pageInfo: { hasNextPage: boolean, endCursor: string | null } } };

export type TransferFundsMutationVariables = Exact<{
  fromAccountId: string | number;
  toAccountId: string | number;
  amount: number;
  idempotencyKey: string;
}>;


export type TransferFundsMutation = { transferFunds: { success: boolean, transaction: { id: string, amount: number, currency: string, createdAt: string } | null } | null };

export type WalletsQueryVariables = Exact<{ [key: string]: never; }>;


export type WalletsQuery = { wallets: Array<{ id: string, label: string, accounts: Array<{ id: string, name: string, type: AccountType, balance: number, currency: string, lastUpdated: string }> }> };

export type CreateWalletMutationVariables = Exact<{
  label: string;
}>;


export type CreateWalletMutation = { createWallet: { id: string, label: string } };



export const AccountsDocument = new TypedDocumentString(`
    query Accounts($walletId: ID!) {
  accounts(walletId: $walletId) {
    id
    name
    type
    balance
    currency
    lastUpdated
  }
}
    `);

export const useAccountsQuery = <
      TData = AccountsQuery,
      TError = unknown
    >(
      variables: AccountsQueryVariables,
      options?: Omit<UseQueryOptions<AccountsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<AccountsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<AccountsQuery, TError, TData>(
      {
    queryKey: ['Accounts', variables],
    queryFn: fetcher<AccountsQuery, AccountsQueryVariables>(AccountsDocument, variables),
    ...options
  }
    )};

useAccountsQuery.getKey = (variables: AccountsQueryVariables) => ['Accounts', variables];


useAccountsQuery.fetcher = (variables: AccountsQueryVariables) => fetcher<AccountsQuery, AccountsQueryVariables>(AccountsDocument, variables);

export const BalanceHistoryDocument = new TypedDocumentString(`
    query BalanceHistory($walletId: ID!) {
  balanceHistory(walletId: $walletId) {
    date
    balance
  }
}
    `);

export const useBalanceHistoryQuery = <
      TData = BalanceHistoryQuery,
      TError = unknown
    >(
      variables: BalanceHistoryQueryVariables,
      options?: Omit<UseQueryOptions<BalanceHistoryQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<BalanceHistoryQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<BalanceHistoryQuery, TError, TData>(
      {
    queryKey: ['BalanceHistory', variables],
    queryFn: fetcher<BalanceHistoryQuery, BalanceHistoryQueryVariables>(BalanceHistoryDocument, variables),
    ...options
  }
    )};

useBalanceHistoryQuery.getKey = (variables: BalanceHistoryQueryVariables) => ['BalanceHistory', variables];


useBalanceHistoryQuery.fetcher = (variables: BalanceHistoryQueryVariables) => fetcher<BalanceHistoryQuery, BalanceHistoryQueryVariables>(BalanceHistoryDocument, variables);

export const SpendingByCategoryDocument = new TypedDocumentString(`
    query SpendingByCategory($walletId: ID!, $startDate: String!, $endDate: String!) {
  spendingByCategory(
    walletId: $walletId
    startDate: $startDate
    endDate: $endDate
  ) {
    category
    amount
  }
}
    `);

export const useSpendingByCategoryQuery = <
      TData = SpendingByCategoryQuery,
      TError = unknown
    >(
      variables: SpendingByCategoryQueryVariables,
      options?: Omit<UseQueryOptions<SpendingByCategoryQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<SpendingByCategoryQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<SpendingByCategoryQuery, TError, TData>(
      {
    queryKey: ['SpendingByCategory', variables],
    queryFn: fetcher<SpendingByCategoryQuery, SpendingByCategoryQueryVariables>(SpendingByCategoryDocument, variables),
    ...options
  }
    )};

useSpendingByCategoryQuery.getKey = (variables: SpendingByCategoryQueryVariables) => ['SpendingByCategory', variables];


useSpendingByCategoryQuery.fetcher = (variables: SpendingByCategoryQueryVariables) => fetcher<SpendingByCategoryQuery, SpendingByCategoryQueryVariables>(SpendingByCategoryDocument, variables);

export const TransactionsDocument = new TypedDocumentString(`
    query Transactions($accountId: ID, $first: Int, $after: String) {
  transactions(accountId: $accountId, first: $first, after: $after) {
    edges {
      node {
        id
        amount
        currency
        type
        description
        createdAt
        sourceAccountId
        destinationAccountId
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
    `);

export const useTransactionsQuery = <
      TData = TransactionsQuery,
      TError = unknown
    >(
      variables?: TransactionsQueryVariables,
      options?: Omit<UseQueryOptions<TransactionsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<TransactionsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<TransactionsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['Transactions'] : ['Transactions', variables],
    queryFn: fetcher<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, variables),
    ...options
  }
    )};

useTransactionsQuery.getKey = (variables?: TransactionsQueryVariables) => variables === undefined ? ['Transactions'] : ['Transactions', variables];


useTransactionsQuery.fetcher = (variables?: TransactionsQueryVariables) => fetcher<TransactionsQuery, TransactionsQueryVariables>(TransactionsDocument, variables);

export const TransferFundsDocument = new TypedDocumentString(`
    mutation TransferFunds($fromAccountId: ID!, $toAccountId: ID!, $amount: Float!, $idempotencyKey: String!) {
  transferFunds(
    fromAccountId: $fromAccountId
    toAccountId: $toAccountId
    amount: $amount
    idempotencyKey: $idempotencyKey
  ) {
    success
    transaction {
      id
      amount
      currency
      createdAt
    }
  }
}
    `);

export const useTransferFundsMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<TransferFundsMutation, TError, TransferFundsMutationVariables, TContext>) => {
    
    return useMutation<TransferFundsMutation, TError, TransferFundsMutationVariables, TContext>(
      {
    mutationKey: ['TransferFunds'],
    mutationFn: (variables?: TransferFundsMutationVariables) => fetcher<TransferFundsMutation, TransferFundsMutationVariables>(TransferFundsDocument, variables)(),
    ...options
  }
    )};


useTransferFundsMutation.fetcher = (variables: TransferFundsMutationVariables) => fetcher<TransferFundsMutation, TransferFundsMutationVariables>(TransferFundsDocument, variables);

export const WalletsDocument = new TypedDocumentString(`
    query Wallets {
  wallets {
    id
    label
    accounts {
      id
      name
      type
      balance
      currency
      lastUpdated
    }
  }
}
    `);

export const useWalletsQuery = <
      TData = WalletsQuery,
      TError = unknown
    >(
      variables?: WalletsQueryVariables,
      options?: Omit<UseQueryOptions<WalletsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<WalletsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<WalletsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['Wallets'] : ['Wallets', variables],
    queryFn: fetcher<WalletsQuery, WalletsQueryVariables>(WalletsDocument, variables),
    ...options
  }
    )};

useWalletsQuery.getKey = (variables?: WalletsQueryVariables) => variables === undefined ? ['Wallets'] : ['Wallets', variables];


useWalletsQuery.fetcher = (variables?: WalletsQueryVariables) => fetcher<WalletsQuery, WalletsQueryVariables>(WalletsDocument, variables);

export const CreateWalletDocument = new TypedDocumentString(`
    mutation CreateWallet($label: String!) {
  createWallet(label: $label) {
    id
    label
  }
}
    `);

export const useCreateWalletMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateWalletMutation, TError, CreateWalletMutationVariables, TContext>) => {
    
    return useMutation<CreateWalletMutation, TError, CreateWalletMutationVariables, TContext>(
      {
    mutationKey: ['CreateWallet'],
    mutationFn: (variables?: CreateWalletMutationVariables) => fetcher<CreateWalletMutation, CreateWalletMutationVariables>(CreateWalletDocument, variables)(),
    ...options
  }
    )};


useCreateWalletMutation.fetcher = (variables: CreateWalletMutationVariables) => fetcher<CreateWalletMutation, CreateWalletMutationVariables>(CreateWalletDocument, variables);
