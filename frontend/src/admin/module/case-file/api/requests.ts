import { apiRequest } from '@/lib/api'
import type {
  AdoptionStep,
  CaseFileResource,
  TransportChecklistResource,
} from '@/api/types/case-file'
import type { AdoptionResponse } from '@/admin/module/adoptions/api/types'

export interface CaseFileResponse {
  message: string
  data: CaseFileResource
}

export async function getCaseFile(
  adoptionId: string
): Promise<CaseFileResource> {
  return apiRequest<CaseFileResource>(`adoptions/${adoptionId}/case-file`)
}

export async function updateCaseFile(
  adoptionId: string,
  values: Record<string, unknown>
): Promise<CaseFileResponse> {
  return apiRequest<CaseFileResponse>(`adoptions/${adoptionId}/case-file`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  })
}

export async function setRequirement(
  adoptionId: string,
  fieldKey: string,
  data: { required_for: AdoptionStep | null; waived: boolean }
): Promise<CaseFileResponse> {
  return apiRequest<CaseFileResponse>(
    `adoptions/${adoptionId}/requirements/${encodeURIComponent(fieldKey)}`,
    { method: 'PUT', body: JSON.stringify(data) }
  )
}

export async function clearRequirement(
  adoptionId: string,
  fieldKey: string
): Promise<CaseFileResponse> {
  return apiRequest<CaseFileResponse>(
    `adoptions/${adoptionId}/requirements/${encodeURIComponent(fieldKey)}`,
    { method: 'DELETE' }
  )
}

export async function confirmPreInspection(
  adoptionId: string
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(
    `adoptions/${adoptionId}/pre-inspection/confirm`,
    { method: 'POST' }
  )
}

export async function unconfirmPreInspection(
  adoptionId: string
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(
    `adoptions/${adoptionId}/pre-inspection/confirm`,
    { method: 'DELETE' }
  )
}

export async function getTransportChecklist(
  transportId: string
): Promise<TransportChecklistResource> {
  return apiRequest<TransportChecklistResource>(
    `transports/${transportId}/checklist`
  )
}
