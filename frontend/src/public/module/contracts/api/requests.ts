import { apiRequest, API_URL } from '@/lib/api'
import type { PublicContract, SubmitContractSignatureRequest } from './types'

export function getPublicContract(token: string): Promise<PublicContract> {
  return apiRequest<PublicContract>(`contracts/${token}`)
}

export function submitPublicContractSignature(
  token: string,
  data: SubmitContractSignatureRequest
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`contracts/${token}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** Not fetched via apiRequest — embedded directly as an <iframe>/<embed> src. */
export function contractDocumentUrl(token: string): string {
  return `${API_URL}/contracts/${token}/document`
}
