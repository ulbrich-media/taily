import { apiRequest } from '@/lib/api'
import type {
  HealthConditionsResponse,
  AnimalTypesResponse,
  CreateHealthConditionRequest,
  CreateHealthConditionResponse,
  UpdateHealthConditionRequest,
  UpdateHealthConditionResponse,
  DeleteHealthConditionResponse,
} from './types'

export async function getHealthConditions(
  query: {
    animal_type_id?: string
  } = {}
): Promise<HealthConditionsResponse> {
  return apiRequest<HealthConditionsResponse>(
    `health-conditions?${new URLSearchParams(query).toString()}`
  )
}

export async function getAnimalTypes(): Promise<AnimalTypesResponse> {
  return apiRequest<AnimalTypesResponse>('animal-types')
}

export async function createHealthCondition(
  data: CreateHealthConditionRequest
): Promise<CreateHealthConditionResponse> {
  return apiRequest<CreateHealthConditionResponse>('health-conditions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateHealthCondition(
  id: string,
  data: UpdateHealthConditionRequest
): Promise<UpdateHealthConditionResponse> {
  return apiRequest<UpdateHealthConditionResponse>(`health-conditions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteHealthCondition(
  id: string
): Promise<DeleteHealthConditionResponse> {
  return apiRequest<DeleteHealthConditionResponse>(`health-conditions/${id}`, {
    method: 'DELETE',
  })
}
