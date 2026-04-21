import { apiRequest } from '@/lib/api'
import type {
  MedicalTestsResponse,
  AnimalTypesResponse,
  CreateMedicalTestRequest,
  CreateMedicalTestResponse,
  UpdateMedicalTestRequest,
  UpdateMedicalTestResponse,
  DeleteMedicalTestResponse,
} from './types'

export async function getMedicalTests(
  query: { animal_type_id?: string } = {}
): Promise<MedicalTestsResponse> {
  return apiRequest<MedicalTestsResponse>(
    `medical-tests?${new URLSearchParams(query).toString()}`
  )
}

export async function getAnimalTypes(): Promise<AnimalTypesResponse> {
  return apiRequest<AnimalTypesResponse>('animal-types')
}

export async function createMedicalTest(
  data: CreateMedicalTestRequest
): Promise<CreateMedicalTestResponse> {
  return apiRequest<CreateMedicalTestResponse>('medical-tests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMedicalTest(
  id: string,
  data: UpdateMedicalTestRequest
): Promise<UpdateMedicalTestResponse> {
  return apiRequest<UpdateMedicalTestResponse>(`medical-tests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMedicalTest(
  id: string
): Promise<DeleteMedicalTestResponse> {
  return apiRequest<DeleteMedicalTestResponse>(`medical-tests/${id}`, {
    method: 'DELETE',
  })
}
