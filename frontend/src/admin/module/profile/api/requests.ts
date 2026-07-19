import { apiRequest } from '@/lib/api'
import type {
  CancelEmailChangeResponse,
  RequestEmailChangeRequest,
  RequestEmailChangeResponse,
} from './types'

// ---------------------------------------------------------------------------
// Email change
// ---------------------------------------------------------------------------
// Gated by a fresh password confirmation server-side; callers should run this
// through usePasswordConfirmation() first, matching the 2FA/passkey flows.

export async function requestEmailChange(
  data: RequestEmailChangeRequest
): Promise<RequestEmailChangeResponse> {
  return apiRequest<RequestEmailChangeResponse>('profile/email', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function cancelEmailChange(): Promise<CancelEmailChangeResponse> {
  return apiRequest<CancelEmailChangeResponse>('profile/email', {
    method: 'DELETE',
  })
}
