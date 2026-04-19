import { queryOptions } from '@tanstack/react-query'
import {
  getAnimals,
  getAnimal,
  type AnimalFilters,
} from '@/admin/module/animals/api/requests.ts'

export const animalQueryKeys = {
  all: ['animals'] as const,
  list: (filters?: AnimalFilters) => ['animals', 'list', filters] as const,
  detail: (id: string) => ['animals', 'detail', id] as const,
}

export const listAnimalsQuery = (filters?: AnimalFilters) =>
  queryOptions({
    queryFn: () => getAnimals(filters),
    queryKey: animalQueryKeys.list(filters),
  })

export const getAnimalQuery = (id: string) =>
  queryOptions({
    queryFn: () => getAnimal(id),
    queryKey: animalQueryKeys.detail(id),
  })
