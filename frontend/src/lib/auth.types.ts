import type { UserRole } from '@/api/types/users'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}
