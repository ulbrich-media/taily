import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error.message.includes('Unauthenticated')) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
