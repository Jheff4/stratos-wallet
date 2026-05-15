import { queryClient } from '../../queryClient';
import { useCallback } from 'react';
import { useTransactionsQuery, type TransactionsQueryVariables } from '@graphql/generated';

export function usePrefetchTransactions(accountId?: string, first = 10) {
  const variables = { accountId, first } satisfies TransactionsQueryVariables;

  const prefetch = useCallback(() => {
    if (!accountId) return;
    queryClient.prefetchInfiniteQuery({
      queryKey: ['Transactions.infinite', accountId, first],
      queryFn: ({ pageParam }) =>
        useTransactionsQuery.fetcher({
          ...variables,
          ...(typeof pageParam === 'string' ? { after: pageParam } : {}),
        })(),
      initialPageParam: undefined,
    });
  }, [accountId, first, variables]);

  return prefetch;
}