import { apiRequest } from '@/lib/api'
import type {
  RecoveryCodes,
  TwoFactorCodeRequest,
  TwoFactorQrCode,
  TwoFactorSecret,
} from './types'

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
