import type { VaccinationResource } from '@/api/types/vaccinations'
import type { AnimalTypeResource } from '@/api/types/animal-types'

export type VaccinationsResponse = VaccinationResource[]
export interface AnimalTypesResponse {
  data: AnimalTypeResource[]
  count: number
}
export interface CreateVaccinationResponse {
  message: string
  data: VaccinationResource
}
export interface UpdateVaccinationResponse {
  message: string
  data: VaccinationResource
}
export interface DeleteVaccinationResponse {
  message: string
}

export interface CreateVaccinationRequest {
  title: string
  description?: string
  animal_type_id: string
}

export interface UpdateVaccinationRequest {
  title: string
  description?: string
  animal_type_id: string
}
