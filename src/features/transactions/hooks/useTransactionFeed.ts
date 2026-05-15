import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useTransactionsQuery,
  type TransactionsQuery,
  type TransactionsQueryVariables,
} from '@graphql/generated';

export function useTransactionFeed(accountId?: string, first = 10) {
  const variables = {
    accountId,
    first,
  } satisfies TransactionsQueryVariables;

  return useInfiniteQuery<TransactionsQuery>({
    queryKey: ['Transactions.infinite', variables],
    queryFn: ({ pageParam }) =>
      useTransactionsQuery.fetcher({
        ...variables,
        ...(typeof pageParam === 'string' ? { after: pageParam } : {}),
      })(),
    getNextPageParam: (lastPage) => {
      const pageInfo = lastPage.transactions.pageInfo;

      return pageInfo.hasNextPage ? pageInfo.endCursor : undefined;
    },
    initialPageParam: undefined,
  });
}
