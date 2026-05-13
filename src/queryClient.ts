import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // We'll discuss this deeply when we fix caching
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
    },
    mutations: {
      retry: false, // Global rule: no retries for mutations (we override per mutation anyway)
    },
  },
});