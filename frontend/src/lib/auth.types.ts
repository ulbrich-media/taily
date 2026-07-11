import type { UserRole } from '@/api/types/users'
import type { TwoFactorChallengeRequest } from '@/admin/module/two-factor/api/types'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  two_factor_enabled: boolean
}

/** Outcome of a credential login: whether a second factor is still required. */
export interface LoginResult {
  twoFactorRequired: boolean
}

export interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  completeTwoFactorChallenge: (data: TwoFactorChallengeRequest) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}
