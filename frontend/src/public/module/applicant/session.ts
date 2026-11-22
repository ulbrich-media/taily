// The portal session token (docs/features/applicant-portal.md): valid for
// two hours, kept for this browser tab only. Storage can be unavailable
// (private windows, blocked site data); then the applicant simply logs in
// again.
const KEY = 'taily.applicant-session'

export function getSessionToken(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string): void {
  try {
    sessionStorage.setItem(KEY, token)
  } catch {
    // Without storage the session lasts until the page is left.
  }
}

export function clearSessionToken(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // Nothing stored.
  }
}
