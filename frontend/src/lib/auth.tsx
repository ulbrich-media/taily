import { type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, csrfCookie } from './api'
import type {
  AuthContextType,
  LoginResult,
  TwoFactorChallengeRequest,
  User,
} from '@/lib/auth.types.ts'
import { AuthContext } from '@/lib/auth.const.tsx'
import { UserRole } from '@/api/types/users'

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

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        return await apiRequest<User>('profile')
      } catch {
        return null
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
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
      queryClient.setQueryData(['profile'], null)
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
    login,
    completeTwoFactorChallenge,
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
