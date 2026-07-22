import { apiRequest } from './api'

export interface ConfirmEmailChangeResponse {
  message: string
}

/**
 * Confirm a pending email change via the mailed link. Unauthenticated: the
 * token itself is the credential, the same trust model as password reset and
 * invitation accept links.
 */
export async function confirmEmailChange(
  token: string
): Promise<ConfirmEmailChangeResponse> {
  return apiRequest<ConfirmEmailChangeResponse>(
    `profile/email/confirm/${token}`,
    {
      method: 'POST',
      requiresAuth: false,
    }
  )
}
