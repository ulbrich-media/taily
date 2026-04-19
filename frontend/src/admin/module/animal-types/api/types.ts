// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type { AnimalTypeResource } from '@/api/types/animal-types'

/** Single animal type (backwards compat alias). */
export type AnimalType = AnimalTypeResource
export interface AnimalTypesResponse {
  data: AnimalTypeResource[]
  count: number
}
export interface AnimalTypeResponse {
  message: string
  data: AnimalTypeResource
}
export interface DeleteAnimalTypeResponse {
  message: string
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CreateAnimalTypeRequest {
  title: string
  form_template_id?: string | null
}

export interface UpdateAnimalTypeRequest {
  title: string
  form_template_id?: string | null
}
