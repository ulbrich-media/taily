const API_URL_ROOT = import.meta.env.VITE_API_URL ?? window.location.origin
const API_URL = `${API_URL_ROOT}/internal`

export class ApiValidationError extends Error {
  errors?: Record<string, string[]>

  constructor(message: string, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiValidationError'
    this.errors = errors
  }
}

export async function csrfCookie(): Promise<void> {
  await fetch(`${API_URL_ROOT}/sanctum/csrf-cookie`, {
    credentials: 'include',
  })
}

function getCSRFToken(): string {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1]

  return token ? decodeURIComponent(token) : ''
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    ...options.headers,
  }

  // Sent whenever the cookie is present, regardless of whether this request
  // is authenticated: the public signing/inspection pages have no login
  // session, but they do sit behind EnsureFrontendRequestsAreStateful (see
  // bootstrap/app.php), so their GET show request already sets this cookie
  // for the submit that follows.
  const csrfToken = getCSRFToken()
  if (csrfToken) {
    // @ts-expect-error custom header not respected by type; this is ok for now
    headers['X-XSRF-TOKEN'] = csrfToken
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new ApiValidationError(
      error.message || 'An error occurred',
      error.errors
    )
  }

  // Some endpoints (e.g. Fortify's logout) answer 204 or an empty body.
  const body = await response.text()
  return body ? (JSON.parse(body) as T) : (undefined as T)
}

export { API_URL }
