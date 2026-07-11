import { apiRequest } from './api'

export interface ConfirmedPasswordStatus {
  confirmed: boolean
}

/**
 * Whether a recent password confirmation is still valid. The SPA checks this
 * before a sensitive action so it only prompts when a fresh confirmation is
 * actually needed.
 */
export async function getConfirmedPasswordStatus(): Promise<ConfirmedPasswordStatus> {
  return apiRequest<ConfirmedPasswordStatus>('user/confirmed-password-status')
}

/**
 * Re-authenticate by confirming the current password. Records the confirmation
 * in the session (valid for the configured password-confirmation window) so the
 * password-gated endpoints accept subsequent requests. Rejects with an
 * ApiValidationError (422) when the password is wrong.
 */
export async function confirmPassword(password: string): Promise<void> {
  await apiRequest('user/confirm-password', {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}
