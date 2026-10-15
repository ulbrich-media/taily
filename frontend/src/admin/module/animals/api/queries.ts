import { queryOptions } from '@tanstack/react-query'
import {
  getAnimalsPage,
  getAnimal,
  getAnimalTraitSuggestions,
} from '@/admin/module/animals/api/requests.ts'
import type { AnimalListParams } from '../animal-list.search'

export const animalQueryKeys = {
  all: ['animals'] as const,
  // Prefix of every list query, so invalidating it covers all pages.
  list: () => ['animals', 'list'] as const,
  page: (params: AnimalListParams, perPage?: number) =>
    perPage === undefined
      ? (['animals', 'list', params] as const)
      : (['animals', 'list', params, perPage] as const),
  detail: (id: string) => ['animals', 'detail', id] as const,
  traitSuggestions: (animalTypeId: string) =>
    ['animals', 'trait-suggestions', animalTypeId] as const,
}

/** One page of the animal list; pass `perPage` for small pages, e.g. in pickers. */
export const listAnimalsPageQuery = (
  params: AnimalListParams,
  perPage?: number
) =>
  queryOptions({
    queryFn: () => getAnimalsPage(params, perPage),
    queryKey: animalQueryKeys.page(params, perPage),
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
