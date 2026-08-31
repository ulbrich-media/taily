import { apiRequest } from './api'

export interface EmailChangeDetails {
  old_email: string
  new_email: string
  expires_at: string
}

export interface ConfirmEmailChangeResponse {
  message: string
}

/**
 * Preview the pending change a confirmation token belongs to, without
 * applying it. Unauthenticated: the token itself is the credential, the same
 * trust model as password reset and invitation accept links.
 */
export async function getEmailChangeDetails(
  token: string
): Promise<EmailChangeDetails> {
  return apiRequest<EmailChangeDetails>(`profile/email/confirm/${token}`, {
    requiresAuth: false,
  })
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
