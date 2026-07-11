// ---------------------------------------------------------------------------
// Response types (returned by the API)
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

// ---------------------------------------------------------------------------
// Request / input types (sent to the API)
// ---------------------------------------------------------------------------

/** Confirm enrolment with a TOTP code. */
export interface TwoFactorCodeRequest {
  code: string
}
