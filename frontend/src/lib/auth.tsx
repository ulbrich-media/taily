import { type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, csrfCookie } from './api'
import type { AuthContextType, User } from '@/lib/auth.types.ts'
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

  const login = async (email: string, password: string) => {
    await csrfCookie()

    await apiRequest('login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    logout,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
