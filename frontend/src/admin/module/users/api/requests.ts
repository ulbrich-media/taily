import { apiRequest } from '@/lib/api'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { UserResource } from '@/api/types/users'
import { buildUserListQuery, type UserListParams } from '../user-list.search'
import type {
  UsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserResponse,
  ResendInvitationResponse,
} from './types'

export async function getUsers(): Promise<UsersResponse> {
  return apiRequest<UsersResponse>('users')
}

/** One page of the user list, see docs/coding-patterns/list-views.md. */
export async function getUsersPage(
  params: UserListParams
): Promise<PaginatedResponse<UserResource>> {
  return apiRequest<PaginatedResponse<UserResource>>(
    `users?${buildUserListQuery(params)}`
  )
}

export async function createUser(
  data: CreateUserRequest
): Promise<CreateUserResponse> {
  return apiRequest<CreateUserResponse>('users', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateUser(
  id: string,
  data: UpdateUserRequest
): Promise<UpdateUserResponse> {
  return apiRequest<UpdateUserResponse>(`users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function resendUserInvitation(
  id: string
): Promise<ResendInvitationResponse> {
  return apiRequest<ResendInvitationResponse>(
    `users/${id}/resend-invitation`,
    { method: 'POST' }
  )
}

export async function deleteUser(id: string): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(`users/${id}`, {
    method: 'DELETE',
  })
}
