import { QueryClient } from '@tanstack/react-query'
import { UnauthenticatedError } from '@/lib/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 401/419 errors
        if (error instanceof UnauthenticatedError) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
