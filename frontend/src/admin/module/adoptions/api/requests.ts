import { apiRequest } from '@/lib/api'
import type {
  Adoption,
  AdoptionResponse,
  AdoptionsResponse,
  CreateAdoptionRequest,
  UpdateAdoptionRequest,
} from './types'

export interface AdoptionsFilters {
  animal_id?: string
  applicant_id?: string
  mediator_id?: string
}

export async function getAdoptions(
  filters?: AdoptionsFilters
): Promise<AdoptionsResponse> {
  const params = new URLSearchParams()
  if (filters?.animal_id) params.set('animal_id', filters.animal_id)
  if (filters?.applicant_id) params.set('applicant_id', filters.applicant_id)
  if (filters?.mediator_id) params.set('mediator_id', filters.mediator_id)
  const qs = params.toString()
  return apiRequest<AdoptionsResponse>(`adoptions${qs ? `?${qs}` : ''}`)
}

export async function getAdoption(id: string): Promise<Adoption> {
  return apiRequest<Adoption>(`adoptions/${id}`)
}

export async function createAdoption(
  data: CreateAdoptionRequest
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>('adoptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAdoption(
  id: string,
  data: Partial<UpdateAdoptionRequest>
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(`adoptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
