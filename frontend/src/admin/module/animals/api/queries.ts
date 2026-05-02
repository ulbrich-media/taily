import { queryOptions } from '@tanstack/react-query'
import {
  getAnimals,
  getAnimal,
  getAnimalTraitSuggestions,
  type AnimalFilters,
} from '@/admin/module/animals/api/requests.ts'

export const animalQueryKeys = {
  all: ['animals'] as const,
  list: (filters?: AnimalFilters) => ['animals', 'list', filters] as const,
  detail: (id: string) => ['animals', 'detail', id] as const,
  traitSuggestions: (animalTypeId: string) =>
    ['animals', 'trait-suggestions', animalTypeId] as const,
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

export const animalTraitSuggestionsQuery = (animalTypeId: string) =>
  queryOptions({
    queryFn: () => getAnimalTraitSuggestions(animalTypeId),
    queryKey: animalQueryKeys.traitSuggestions(animalTypeId),
  })
