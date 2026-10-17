import { queryOptions } from '@tanstack/react-query'
import { getAnimalTypes, getAnimalTypesPage, getAnimalType } from './requests'
import type { PlainListParams } from '@/components/list/plain-list-search'

export const animalTypeQueryKeys = {
  all: ['animal-types'] as const,
  // Prefix of every list query, so invalidating it covers all pages.
  list: ['animal-types', 'list'] as const,
  page: (params: PlainListParams) =>
    ['animal-types', 'list', 'page', params] as const,
  detail: (id: string) => ['animal-types', 'detail', id] as const,
}

export const listAnimalTypesQuery = queryOptions({
  queryKey: animalTypeQueryKeys.list,
  queryFn: getAnimalTypes,
})

export const listAnimalTypesPageQuery = (params: PlainListParams) =>
  queryOptions({
    queryKey: animalTypeQueryKeys.page(params),
    queryFn: () => getAnimalTypesPage(params),
  })

export const getAnimalTypeQuery = (id: string) =>
  queryOptions({
    queryKey: animalTypeQueryKeys.detail(id),
    queryFn: () => getAnimalType(id),
  })
