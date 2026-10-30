import { apiRequest } from '@/lib/api'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { VaccinationResource } from '@/api/types/vaccinations'
import {
  buildAnimalTypeItemListQuery,
  type AnimalTypeItemListParams,
} from '@/admin/module/animal-types/animal-type-item-list.search'
import type {
  VaccinationsResponse,
  CreateVaccinationRequest,
  CreateVaccinationResponse,
  UpdateVaccinationRequest,
  UpdateVaccinationResponse,
  DeleteVaccinationResponse,
} from './types'

export async function getVaccinations(
  query: { animal_type_id?: string } = {}
): Promise<VaccinationsResponse> {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
  ).toString()
  return apiRequest<VaccinationsResponse>(
    params ? `vaccinations?${params}` : 'vaccinations'
  )
}

/** One page of the merged vaccination list, see docs/coding-patterns/list-views.md. */
export async function getVaccinationsPage(
  params: AnimalTypeItemListParams
): Promise<PaginatedResponse<VaccinationResource>> {
  return apiRequest<PaginatedResponse<VaccinationResource>>(
    `vaccinations?${buildAnimalTypeItemListQuery(params)}`
  )
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
