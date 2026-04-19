import { apiRequest } from '@/lib/api'
import type {
  PreInspectionsResponse,
  PreInspection,
  CreatePreInspectionRequest,
  UpdatePreInspectionRequest,
  PreInspectionResponse,
  DeletePreInspectionResponse,
} from './types'

export async function getPreInspections(
  params: {
    person_id?: string
    animal_type_id?: string
  } = {}
): Promise<PreInspectionsResponse> {
  const query = new URLSearchParams()
  if (params.person_id) query.set('person_id', params.person_id)
  if (params.animal_type_id) query.set('animal_type_id', params.animal_type_id)
  const qs = query.toString()
  return apiRequest<PreInspectionsResponse>(
    `pre-inspections${qs ? `?${qs}` : ''}`
  )
}

export async function getPreInspection(id: string): Promise<PreInspection> {
  return apiRequest<PreInspection>(`pre-inspections/${id}`)
}

export async function createPreInspection(
  data: CreatePreInspectionRequest
): Promise<PreInspectionResponse> {
  return apiRequest<PreInspectionResponse>('pre-inspections', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePreInspection(
  id: string,
  data: UpdatePreInspectionRequest
): Promise<PreInspectionResponse> {
  return apiRequest<PreInspectionResponse>(`pre-inspections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePreInspection(
  id: string
): Promise<DeletePreInspectionResponse> {
  return apiRequest<DeletePreInspectionResponse>(`pre-inspections/${id}`, {
    method: 'DELETE',
  })
}
