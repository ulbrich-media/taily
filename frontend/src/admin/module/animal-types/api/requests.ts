import { apiRequest } from '@/lib/api'
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
