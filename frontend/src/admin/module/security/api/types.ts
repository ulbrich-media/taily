// ---------------------------------------------------------------------------
// Password change
// ---------------------------------------------------------------------------

export interface UpdatePasswordRequest {
  current_password: string
  password: string
  password_confirmation: string
}

export interface UpdatePasswordResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Password confirmation (re-authentication before sensitive actions)
// ---------------------------------------------------------------------------

export interface ConfirmedPasswordStatus {
  confirmed: boolean
}

// ---------------------------------------------------------------------------
// Two-factor authentication
// ---------------------------------------------------------------------------

/** QR code payload for the authenticator app enrolment. */
export interface TwoFactorQrCode {
  svg: string
  url: string
}

/** Plain-text TOTP secret, offered for manual authenticator entry. */
export interface TwoFactorSecret {
  secretKey: string
}

/** Recovery codes are returned as a bare array of strings. */
export type RecoveryCodes = string[]

/** Confirm enrolment with a TOTP code. */
export interface TwoFactorCodeRequest {
  code: string
}
