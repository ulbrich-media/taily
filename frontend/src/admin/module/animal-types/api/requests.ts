import { apiRequest } from '@/lib/api'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import {
  buildPlainListQuery,
  type PlainListParams,
} from '@/components/list/plain-list-search'
import type {
  AnimalTypesResponse,
  AnimalType,
  CreateAnimalTypeRequest,
  UpdateAnimalTypeRequest,
  AnimalTypeResponse,
  DeleteAnimalTypeResponse,
} from './types'

export async function getAnimalTypes(): Promise<AnimalTypesResponse> {
  return apiRequest<AnimalTypesResponse>('animal-types')
}

/** One page of the animal type list, see docs/coding-patterns/list-views.md. */
export async function getAnimalTypesPage(
  params: PlainListParams
): Promise<PaginatedResponse<AnimalTypeResource>> {
  return apiRequest<PaginatedResponse<AnimalTypeResource>>(
    `animal-types?${buildPlainListQuery(params)}`
  )
}

export async function getAnimalType(id: string): Promise<AnimalType> {
  return apiRequest<AnimalType>(`animal-types/${id}`)
}

export async function createAnimalType(
  data: CreateAnimalTypeRequest
): Promise<AnimalTypeResponse> {
  return apiRequest<AnimalTypeResponse>('animal-types', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAnimalType(
  id: string,
  data: UpdateAnimalTypeRequest
): Promise<AnimalTypeResponse> {
  return apiRequest<AnimalTypeResponse>(`animal-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAnimalType(
  id: string
): Promise<DeleteAnimalTypeResponse> {
  return apiRequest<DeleteAnimalTypeResponse>(`animal-types/${id}`, {
    method: 'DELETE',
  })
}
