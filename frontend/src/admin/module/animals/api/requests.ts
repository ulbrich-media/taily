import { apiRequest } from '@/lib/api'
import type {
  AnimalListResource,
  AnimalDetailResource,
  AnimalPicture,
} from '@/api/types/animals'
import type { CreateAnimalRequest, UpdateAnimalRequest } from './types'

export interface AnimalFilters {
  animal_type_id?: string
}

export async function getAnimals(
  filters?: AnimalFilters
): Promise<AnimalListResource[]> {
  const params = new URLSearchParams()

  if (filters?.animal_type_id) {
    params.append('animal_type_id', filters.animal_type_id)
  }

  const queryString = params.toString()
  const url = queryString ? `animals?${queryString}` : 'animals'

  return apiRequest<AnimalListResource[]>(url)
}

export async function getAnimal(id: string): Promise<AnimalDetailResource> {
  return apiRequest<AnimalDetailResource>(`animals/${id}`)
}

export async function createAnimal(
  data: CreateAnimalRequest
): Promise<{ message: string; data: AnimalDetailResource }> {
  return apiRequest<{ message: string; data: AnimalDetailResource }>(
    'animals',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  )
}

export async function updateAnimal(
  id: string,
  data: Partial<UpdateAnimalRequest>
): Promise<{ message: string; data: AnimalDetailResource }> {
  return apiRequest<{ message: string; data: AnimalDetailResource }>(
    `animals/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

export async function uploadAnimalPicture(
  animalId: string,
  file: File
): Promise<{ message: string; data: AnimalPicture }> {
  const formData = new FormData()
  formData.append('file', file)
  return apiRequest(`animals/${animalId}/pictures`, {
    method: 'POST',
    body: formData,
  })
}

export async function deleteAnimalPicture(
  animalId: string,
  pictureId: string
): Promise<{ message: string }> {
  return apiRequest(`animals/${animalId}/pictures/${pictureId}`, {
    method: 'DELETE',
  })
}

export async function getAnimalTraitSuggestions(
  animalTypeId: string
): Promise<{ compatibilities: string[]; personality_traits: string[] }> {
  return apiRequest(
    `animals/trait-suggestions?animal_type_id=${encodeURIComponent(animalTypeId)}`
  )
}

export async function reorderAnimalPictures(
  animalId: string,
  ids: string[]
): Promise<{ message: string }> {
  return apiRequest(`animals/${animalId}/pictures/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}
