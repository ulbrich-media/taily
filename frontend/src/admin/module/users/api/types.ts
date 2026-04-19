// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { UserResource, UserRole } from '@/api/types/users'

export type UsersResponse = UserResource[]
export interface CreateUserResponse {
  message: string
  data: UserResource
}
export interface UpdateUserResponse {
  message: string
  data: UserResource
}
export interface DeleteUserResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateUserRequest {
  name: string
  email: string
  role: UserRole
}

export interface UpdateUserRequest {
  name: string
  email: string
  role: UserRole
}
