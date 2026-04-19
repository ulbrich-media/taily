import { apiRequest } from '@/lib/api'
import type {
  PeopleResponse,
  Person,
  CreatePersonRequest,
  PersonResponse,
  UpdatePersonRequest,
  DeletePersonResponse,
} from './types'
import type { PersonPicture } from '@/api/types/people'

export interface GetPeopleParams {
  role?: 'inspector' | 'mediator' | 'foster' | 'adopter'
  animal_type_id?: string
  organization_id?: string
}

export async function getPeople(
  params: GetPeopleParams = {}
): Promise<PeopleResponse> {
  const query = new URLSearchParams()
  if (params.role) query.set('role', params.role)
  if (params.animal_type_id) query.set('animal_type_id', params.animal_type_id)
  if (params.organization_id)
    query.set('organization_id', params.organization_id)
  const qs = query.toString()
  return apiRequest<PeopleResponse>(`persons${qs ? `?${qs}` : ''}`)
}

export async function getPerson(id: string): Promise<Person> {
  return apiRequest<Person>(`persons/${id}`)
}

export async function createPerson(
  data: CreatePersonRequest
): Promise<PersonResponse> {
  return apiRequest<PersonResponse>('persons', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updatePerson(
  id: string,
  data: UpdatePersonRequest
): Promise<PersonResponse> {
  return apiRequest<PersonResponse>(`persons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deletePerson(id: string): Promise<DeletePersonResponse> {
  return apiRequest<DeletePersonResponse>(`persons/${id}`, {
    method: 'DELETE',
  })
}

export async function uploadPersonPicture(
  personId: string,
  file: File
): Promise<{ message: string; data: PersonPicture }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest(`persons/${personId}/pictures`, {
    method: 'POST',
    body: formData,
  })
}

export async function deletePersonPicture(
  personId: string,
  pictureId: string
): Promise<{ message: string }> {
  return apiRequest(`persons/${personId}/pictures/${pictureId}`, {
    method: 'DELETE',
  })
}

export async function reorderPersonPictures(
  personId: string,
  ids: string[]
): Promise<{ message: string }> {
  return apiRequest(`persons/${personId}/pictures/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}
