import { apiRequest } from '@/lib/api'
import type { UpdatePasswordRequest, UpdatePasswordResponse } from './types'

export async function updatePassword(
  data: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> {
  return apiRequest<UpdatePasswordResponse>('profile/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
