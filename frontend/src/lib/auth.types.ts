import type { UserRole } from '@/api/types/users'

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

/**
 * Second factor for the login challenge. Exactly one of a TOTP code or a
 * one-time recovery code is sent — the discriminated union makes supplying
 * both (or neither) a compile-time error. Completing the challenge is part of
 * the login flow, so the contract lives with auth rather than the 2FA feature
 * module (keeping the auth layer free of feature-module dependencies).
 */
export type TwoFactorChallengeRequest =
  | { code: string; recovery_code?: undefined }
  | { code?: undefined; recovery_code: string }

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
