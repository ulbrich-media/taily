import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiRequest,
  csrfCookie,
  setUnauthenticatedHandler,
  UnauthenticatedError,
} from './api'
import type {
  AuthContextType,
  LoginResult,
  TwoFactorChallengeRequest,
  User,
} from '@/lib/auth.types.ts'
import { AuthContext } from '@/lib/auth.const.tsx'
import { UserRole } from '@/api/types/users'
import { clearRememberedListSearches } from '@/components/list/remembered-list-search'

interface AuthProviderProps {
  children: ReactNode
  onLoginSuccess?: () => void
  onLogoutSuccess?: () => void
}

export function AuthProvider({
  children,
  onLoginSuccess,
  onLogoutSuccess,
}: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [sessionExpired, setSessionExpired] = useState(false)

  // Ends the session locally when the server reports it is gone. Idempotent:
  // only acts while a user is still signed in, so a profile refetch and a 401
  // from another request firing together cause a single transition. Users who
  // were never signed in (public pages, first visit) are left alone.
  const expireSession = useCallback(() => {
    if (!queryClient.getQueryData<User | null>(['profile'])) {
      return
    }
    setSessionExpired(true)
    queryClient.setQueryData(['profile'], null)
  }, [queryClient])

  useEffect(() => {
    setUnauthenticatedHandler(expireSession)
    return () => setUnauthenticatedHandler(null)
  }, [expireSession])

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        return await apiRequest<User>('profile')
      } catch (error) {
        if (error instanceof UnauthenticatedError) {
          expireSession()
          return null
        }
        // Network or server errors must not log the user out; keep the
        // current user (if any) until the next successful check.
        return queryClient.getQueryData<User | null>(['profile']) ?? null
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    // Re-check the session as soon as the user returns to the tab.
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: false,
  })

  const login = async (
    email: string,
    password: string,
    remember: boolean
  ): Promise<LoginResult> => {
    await csrfCookie()

    // When the user has a confirmed second factor, the login endpoint answers
    // `{ two_factor: true }` and holds the pending login (including `remember`)
    // in the session instead of authenticating. The caller then routes to the
    // challenge screen, and completeTwoFactorChallenge() below finishes it.
    const response = await apiRequest<{ two_factor?: boolean } | undefined>(
      'login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, remember }),
      }
    )

    if (response?.two_factor) {
      return { twoFactorRequired: true }
    }

    await refetch()
    setSessionExpired(false)
    clearRememberedListSearches()
    onLoginSuccess?.()
    return { twoFactorRequired: false }
  }

  const completeTwoFactorChallenge = async (
    data: TwoFactorChallengeRequest
  ) => {
    // The pending login is held in the session by the preceding /login call,
    // so no credentials are re-sent here.
    await apiRequest('two-factor-challenge', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    await refetch()
    setSessionExpired(false)
    clearRememberedListSearches()
    onLoginSuccess?.()
  }

  const logout = async () => {
    try {
      await csrfCookie()
      await apiRequest('logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setSessionExpired(false)
      queryClient.setQueryData(['profile'], null)
      clearRememberedListSearches()
      onLogoutSuccess?.()
    }
  }

  const refreshProfile = async () => {
    await refetch()
  }

  const value: AuthContextType = {
    user: user ?? null,
    isAdmin: user?.role === UserRole.Admin,
    isLoading,
    isAuthenticated: !!user,
    sessionExpired,
    login,
    completeTwoFactorChallenge,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
