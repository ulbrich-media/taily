const API_URL_ROOT = import.meta.env.VITE_API_URL ?? window.location.origin
const API_URL = `${API_URL_ROOT}/internal`

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

interface ApiRequestOptions extends RequestInit {
  requiresAuth?: boolean
}

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options

  const isFormData = fetchOptions.body instanceof FormData
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    Accept: 'application/json',
    ...fetchOptions.headers,
  }

  if (requiresAuth) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      // @ts-expect-error custom header not respected by type; this is ok for now
      headers['X-XSRF-TOKEN'] = csrfToken
    }
  }

  const response = await fetch(`${API_URL}/${endpoint}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }))
    throw new Error(error.message || 'An error occurred')
  }

  return response.json()
}

export { API_URL }
