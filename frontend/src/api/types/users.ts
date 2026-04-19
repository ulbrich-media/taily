// Mirrors: api/app/Http/Resources/UserResource.php
//          api/app/Http/Resources/UserInvitationResource.php

export const UserRole = {
  Admin: 'admin',
  User: 'user',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export interface UserInvitationResource {
  id: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface UserResource {
  id: string
  name: string
  email: string
  role: UserRole
  last_login_at: string | null
  created_at: string
  updated_at: string
  // Present when loaded (admin-only)
  invitation: UserInvitationResource | null
}
