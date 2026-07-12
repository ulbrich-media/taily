import { Passkeys, type RouteOverrides } from '@laravel/passkeys'
import { API_URL } from '@/lib/api'

// The client's default routes are same-origin paths (e.g. `/user/passkeys`),
// but the API lives under `${API_URL}/internal` and, in most deployments, on
// a different origin than the SPA — so every call needs the full absolute URL
// and cross-origin credentials, matching how `apiRequest` already talks to
// the API.
Passkeys.configure({
  fetch: { credentials: 'include' },
})

export const PASSKEY_REGISTER_ROUTES: RouteOverrides['routes'] = {
  options: `${API_URL}/user/passkeys/options`,
  submit: `${API_URL}/user/passkeys`,
}

export const PASSKEY_VERIFY_ROUTES: RouteOverrides['routes'] = {
  options: `${API_URL}/passkeys/login/options`,
  submit: `${API_URL}/passkeys/login`,
}

export { Passkeys }
export type { PasskeyError } from '@laravel/passkeys'
