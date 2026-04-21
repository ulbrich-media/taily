import { apiRequest } from '@/lib/api'
import type {
  VaccinationsResponse,
  AnimalTypesResponse,
  CreateVaccinationRequest,
  CreateVaccinationResponse,
  UpdateVaccinationRequest,
  UpdateVaccinationResponse,
  DeleteVaccinationResponse,
} from './types'

export async function getVaccinations(
  query: { animal_type_id?: string } = {}
): Promise<VaccinationsResponse> {
  return apiRequest<VaccinationsResponse>(
    `vaccinations?${new URLSearchParams(query).toString()}`
  )
}

export async function getAnimalTypes(): Promise<AnimalTypesResponse> {
  return apiRequest<AnimalTypesResponse>('animal-types')
}

export async function createVaccination(
  data: CreateVaccinationRequest
): Promise<CreateVaccinationResponse> {
  return apiRequest<CreateVaccinationResponse>('vaccinations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVaccination(
  id: string,
  data: UpdateVaccinationRequest
): Promise<UpdateVaccinationResponse> {
  return apiRequest<UpdateVaccinationResponse>(`vaccinations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteVaccination(
  id: string
): Promise<DeleteVaccinationResponse> {
  return apiRequest<DeleteVaccinationResponse>(`vaccinations/${id}`, {
    method: 'DELETE',
  })
}
