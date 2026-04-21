import type { MedicalTestResource } from '@/api/types/medical-tests'
import type { AnimalTypeResource } from '@/api/types/animal-types'

export type MedicalTestsResponse = MedicalTestResource[]
export interface AnimalTypesResponse {
  data: AnimalTypeResource[]
  count: number
}
export interface CreateMedicalTestResponse {
  message: string
  data: MedicalTestResource
}
export interface UpdateMedicalTestResponse {
  message: string
  data: MedicalTestResource
}
export interface DeleteMedicalTestResponse {
  message: string
}

export interface CreateMedicalTestRequest {
  title: string
  description?: string
  animal_type_id: string
}

export interface UpdateMedicalTestRequest {
  title: string
  description?: string
  animal_type_id: string
}
