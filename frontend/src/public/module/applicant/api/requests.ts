import { apiRequest, csrfCookie } from '@/lib/api'
import { getSessionToken } from '../session'
import type {
  ApplicationForm,
  PortalAdoption,
  PortalOverview,
  SessionResponse,
} from './types'

// The public pages have no prior request that sets the CSRF cookie.
async function post<T>(endpoint: string, body?: unknown, method = 'POST') {
  await csrfCookie()
  return apiRequest<T>(endpoint, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: authHeader(),
  })
}

function authHeader(): HeadersInit {
  const token = getSessionToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const getApplicationForm = (animalId: string) =>
  apiRequest<ApplicationForm>(`apply/${animalId}`)

export const submitApplication = (
  animalId: string,
  values: Record<string, unknown>
) => post<{ message: string }>(`apply/${animalId}`, { values })

export const confirmApplication = (token: string) =>
  post<SessionResponse>(`apply/confirm/${token}`)

export const requestLoginLink = (email: string) =>
  post<{ message: string }>('portal/login', { email })

export const loginWithLink = (token: string) =>
  post<SessionResponse>(`portal/login/${token}`)

export const logout = () => post<{ message: string }>('portal/logout')

export const getPortalOverview = () =>
  apiRequest<PortalOverview>('portal/adoptions', { headers: authHeader() })

export const getPortalAdoption = (id: string) =>
  apiRequest<PortalAdoption>(`portal/adoptions/${id}`, {
    headers: authHeader(),
  })

export const updatePortalCaseFile = (
  id: string,
  values: Record<string, unknown>
) =>
  post<{ message: string; data: PortalAdoption }>(
    `portal/adoptions/${id}/case-file`,
    { values },
    'PUT'
  )
