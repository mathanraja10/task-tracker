import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/lib/api-client';

const MAX_RETRIES = 2;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a 4xx won't change the outcome; retry network/5xx errors only.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.isClientError) && failureCount < MAX_RETRIES,
    },
    mutations: {
      retry: false,
    },
  },
});
