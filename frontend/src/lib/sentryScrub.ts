/**
 * Removes access tokens from data before it is sent to Sentry.
 *
 * Several frontend and API URLs carry an access token as a path segment
 * (e.g. /inspect/$token, /internal/contracts/{token}/submit). Query
 * parameters are dropped by the SDK itself (`dataCollection.urlQueryParams`),
 * but path segments are not, so they would end up in request URLs,
 * breadcrumbs, spans and replays.
 */

export const FILTERED = '[Filtered]'

// The segment after one of these path parts is a token. `/settings/contracts/`
// holds contract template IDs in the admin, which are no secrets. Route
// patterns (`$token`, `{token}`) are kept.
const TOKEN_PATH =
  /(\/(?:invitations?|inspect|confirm|login|(?<!settings\/)contracts)\/)(?![{$])[^/?#\s"'<>]+/g

export function scrubTokens(value: string): string {
  return value.replace(TOKEN_PATH, `$1${FILTERED}`)
}

/**
 * Whether a URL carries an access token, in its path or as a `token` query
 * parameter (e.g. /callback?action=inspect&token=…, /admin/reset-password).
 */
export function isTokenUrl(url: string): boolean {
  return scrubTokens(url) !== url || /[?&]token=/.test(url)
}

/**
 * Replaces tokens in every string of the given value. Objects and arrays are
 * changed in place (Sentry events and replay frames can be large), so the
 * same value is returned; usable directly as a `beforeSend`-style hook.
 */
export function scrubSentryData<T>(value: T): T {
  return scrubValue(value, new WeakSet()) as T
}

function scrubValue(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') {
    return scrubTokens(value)
  }
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return value
  }
  seen.add(value)

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = scrubValue(value[i], seen)
    }
    return value
  }

  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    record[key] = scrubValue(record[key], seen)
  }
  return value
}
