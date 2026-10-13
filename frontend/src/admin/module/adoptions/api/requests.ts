import { apiRequest } from '@/lib/api'
import type { ContractTemplate } from '@/api/types/adoptions'
import type {
  Adoption,
  AdoptionResponse,
  AdoptionsResponse,
  CreateAdoptionRequest,
  GenerateContractResponse,
  UpdateAdoptionRequest,
  UpdateContractRequest,
} from './types'

export interface AdoptionsFilters {
  animal_id?: string
  applicant_id?: string
  mediator_id?: string
}

// The list endpoint is paginated (max. 100 per page, see ADR-014). Until the
// list views paginate, this fetches the first page in full.
const MAX_PER_PAGE = 100

export async function getAdoptions(
  filters?: AdoptionsFilters
): Promise<AdoptionsResponse> {
  const params = new URLSearchParams({ per_page: String(MAX_PER_PAGE) })
  if (filters?.animal_id) params.set('filter[animal_id]', filters.animal_id)
  if (filters?.applicant_id)
    params.set('filter[applicant_id]', filters.applicant_id)
  if (filters?.mediator_id)
    params.set('filter[mediator_id]', filters.mediator_id)
  const response = await apiRequest<{ data: AdoptionsResponse }>(
    `adoptions?${params.toString()}`
  )
  return response.data
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

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  return apiRequest<ContractTemplate[]>('adoptions/contract-templates')
}

export async function generateContract(
  id: string,
  template: string
): Promise<GenerateContractResponse> {
  return apiRequest<GenerateContractResponse>(
    `adoptions/${id}/contract/generate?template=${encodeURIComponent(template)}`
  )
}

export async function startContractSigning(
  id: string,
  template: string
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(`adoptions/${id}/contract/signing`, {
    method: 'POST',
    body: JSON.stringify({ template }),
  })
}

export async function cancelContractSigning(
  id: string
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(
    `adoptions/${id}/contract/signing/cancel`,
    { method: 'POST' }
  )
}

export async function resendContractSigning(
  id: string
): Promise<AdoptionResponse> {
  return apiRequest<AdoptionResponse>(
    `adoptions/${id}/contract/signing/resend`,
    { method: 'POST' }
  )
}
