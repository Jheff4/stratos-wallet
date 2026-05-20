import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2, // Retry failed queries up to 2 times
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
    mutations: {
      retry: false, // Don't retry failed mutations
    },
  },
});
