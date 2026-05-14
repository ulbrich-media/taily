import { apiRequest } from '@/lib/api'
import type {
  Adoption,
  AdoptionResponse,
  AdoptionsResponse,
  CreateAdoptionRequest,
  UpdateAdoptionRequest,
  UpdateContractRequest,
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

export async function updateContract(
  id: string,
  data: UpdateContractRequest
): Promise<AdoptionResponse> {
  const formData = new FormData()
  formData.append('_method', 'PUT')
  formData.append('contract_signed', data.contract_signed ? '1' : '0')
  if (data.contract_signed_at !== undefined) {
    formData.append('contract_signed_at', data.contract_signed_at ?? '')
  }
  if (data.file) {
    formData.append('file', data.file)
  }
  if (data.remove_file) {
    formData.append('remove_file', '1')
  }
  return apiRequest<AdoptionResponse>(`adoptions/${id}/contract`, {
    method: 'POST',
    body: formData,
  })
}
