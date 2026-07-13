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

// ---------------------------------------------------------------------------
// Passkeys
// ---------------------------------------------------------------------------

export interface Passkey {
  id: string
  name: string
  /** Human-readable authenticator label (e.g. "iCloud Keychain"), when known. */
  authenticator: string | null
  last_used_at: string | null
  created_at: string
}

// ---------------------------------------------------------------------------
// Active sessions
// ---------------------------------------------------------------------------

export interface Session {
  /** Opaque identifier (a hash of the session token, never the token itself). */
  id: string
  ip_address: string | null
  browser: string | null
  platform: string | null
  is_current_device: boolean
  last_active_at: string
}
