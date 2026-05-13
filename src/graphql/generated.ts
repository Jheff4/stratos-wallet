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

export type AccountsQueryVariables = Exact<{
  walletId: string | number;
}>;


export type AccountsQuery = { accounts: Array<{ id: string, name: string, type: AccountType, balance: number, currency: string, lastUpdated: string }> };

export type TransferFundsMutationVariables = Exact<{
  fromAccountId: string | number;
  toAccountId: string | number;
  amount: number;
  idempotencyKey: string;
}>;


export type TransferFundsMutation = { transferFunds: { success: boolean, transaction: { id: string, amount: number, currency: string, createdAt: string } | null } | null };

export type WalletsQueryVariables = Exact<{ [key: string]: never; }>;


export type WalletsQuery = { wallets: Array<{ id: string, label: string, accounts: Array<{ id: string, name: string, balance: number }> }> };

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
      balance
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
