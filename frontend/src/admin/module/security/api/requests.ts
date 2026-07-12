import { apiRequest } from '@/lib/api'
import type {
  ConfirmedPasswordStatus,
  Passkey,
  RecoveryCodes,
  TwoFactorCodeRequest,
  TwoFactorQrCode,
  TwoFactorSecret,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
} from './types'

// ---------------------------------------------------------------------------
// Password change
// ---------------------------------------------------------------------------

export async function updatePassword(
  data: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> {
  return apiRequest<UpdatePasswordResponse>('profile/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ---------------------------------------------------------------------------
// Password confirmation (re-authentication before sensitive actions)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Two-factor authentication
// ---------------------------------------------------------------------------

/**
 * Begin enrolment. Generates the TOTP secret and recovery codes but does not
 * activate the second factor yet — the user must confirm a code first (the
 * `confirm` option is enabled server-side).
 */
export async function enableTwoFactor(): Promise<void> {
  await apiRequest('user/two-factor-authentication', { method: 'POST' })
}

/** Remove the second factor entirely. */
export async function disableTwoFactor(): Promise<void> {
  await apiRequest('user/two-factor-authentication', { method: 'DELETE' })
}

/** Activate the pending second factor by proving the authenticator works. */
export async function confirmTwoFactor(
  data: TwoFactorCodeRequest
): Promise<void> {
  await apiRequest('user/confirmed-two-factor-authentication', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getTwoFactorQrCode(): Promise<TwoFactorQrCode> {
  return apiRequest<TwoFactorQrCode>('user/two-factor-qr-code')
}

export async function getTwoFactorSecret(): Promise<TwoFactorSecret> {
  return apiRequest<TwoFactorSecret>('user/two-factor-secret-key')
}

export async function getRecoveryCodes(): Promise<RecoveryCodes> {
  return apiRequest<RecoveryCodes>('user/two-factor-recovery-codes')
}

export async function regenerateRecoveryCodes(): Promise<void> {
  await apiRequest('user/two-factor-recovery-codes', { method: 'POST' })
}

// ---------------------------------------------------------------------------
// Passkeys
// ---------------------------------------------------------------------------
// Registration and login run through the `@laravel/passkeys` client
// (`@/lib/passkeys`), which drives the WebAuthn ceremony itself and posts the
// result. Listing and deletion are plain JSON endpoints.

export async function getPasskeys(): Promise<Passkey[]> {
  const { data } = await apiRequest<{ data: Passkey[] }>('user/passkeys')
  return data
}

export async function deletePasskey(id: string): Promise<void> {
  await apiRequest(`user/passkeys/${id}`, { method: 'DELETE' })
}
