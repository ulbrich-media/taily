import { apiRequest } from '@/lib/api'
import type { PublicInspection, SubmitInspectionRequest } from './types'

export function getPublicInspection(token: string): Promise<PublicInspection> {
  return apiRequest<PublicInspection>(`inspect/${token}`, {
    requiresAuth: false,
  })
}

export function submitPublicInspection(
  token: string,
  data: SubmitInspectionRequest
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`inspect/${token}/submit`, {
    method: 'POST',
    requiresAuth: false,
    body: JSON.stringify(data),
  })
}
