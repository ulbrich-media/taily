import { apiRequest } from '@/lib/api'
import type {
  UsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserResponse,
} from './types'

export async function getUsers(): Promise<UsersResponse> {
  return apiRequest<UsersResponse>('users')
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

export async function deleteUser(id: string): Promise<DeleteUserResponse> {
  return apiRequest<DeleteUserResponse>(`users/${id}`, {
    method: 'DELETE',
  })
}
