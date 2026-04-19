// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { HealthConditionResource } from '@/api/types/health-conditions'
import type { AnimalTypeResource } from '@/api/types/animal-types'

export type HealthConditionsResponse = HealthConditionResource[]
export interface AnimalTypesResponse {
  data: AnimalTypeResource[]
  count: number
}
export interface CreateHealthConditionResponse {
  message: string
  data: HealthConditionResource
}
export interface UpdateHealthConditionResponse {
  message: string
  data: HealthConditionResource
}
export interface DeleteHealthConditionResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateHealthConditionRequest {
  name: string
  animal_type_id: string
}

export interface UpdateHealthConditionRequest {
  name: string
  animal_type_id: string
}
