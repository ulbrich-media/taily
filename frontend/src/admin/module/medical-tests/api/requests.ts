import { apiRequest } from '@/lib/api'
import type {
  MedicalTestsResponse,
  CreateMedicalTestRequest,
  CreateMedicalTestResponse,
  UpdateMedicalTestRequest,
  UpdateMedicalTestResponse,
  DeleteMedicalTestResponse,
} from './types'

export async function getMedicalTests(
  query: { animal_type_id?: string } = {}
): Promise<MedicalTestsResponse> {
  const params = new URLSearchParams(
    Object.fromEntries(
      Object.entries(query).filter(([, v]) => v !== undefined)
    ) as Record<string, string>
  ).toString()
  return apiRequest<MedicalTestsResponse>(
    params ? `medical-tests?${params}` : 'medical-tests'
  )
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
