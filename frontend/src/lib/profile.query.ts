import type { QueryClient } from '@tanstack/react-query'
import { UserRole } from '@/api/types/users'
import { apiRequest, UnauthenticatedError } from './api'
import type { User } from '@/lib/auth.types'

/** Loads the signed-in user; resolves to `null` when the session is gone. */
export async function fetchProfile(): Promise<User | null> {
  try {
    return await apiRequest<User>('profile')
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return null
    }
    throw error
  }
}

export type AdminAccess = { isAdmin: boolean; isAuthenticated: boolean }

/**
 * Resolves the admin flag for route guards. Uses the cached profile when
 * present and fetches it on a cold start (direct link / reload), so guards
 * never run against an empty cache. Failures are not cached.
 */
export async function resolveAdminAccess(
  queryClient: QueryClient
): Promise<AdminAccess> {
  try {
    const user = await queryClient.ensureQueryData<User | null>({
      queryKey: ['profile'],
      queryFn: fetchProfile,
    })
    return {
      isAdmin: user?.role === UserRole.Admin,
      isAuthenticated: !!user,
    }
  } catch {
    // Network/server error: treat as non-admin without caching a result, so
    // the provider's own refetch can recover.
    return { isAdmin: false, isAuthenticated: true }
  }
}
