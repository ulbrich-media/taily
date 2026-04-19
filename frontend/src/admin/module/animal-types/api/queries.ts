import { queryOptions } from '@tanstack/react-query'
import { getAnimalTypes, getAnimalType } from './requests'

export const animalTypeQueryKeys = {
  all: ['animal-types'] as const,
  list: ['animal-types', 'list'] as const,
  detail: (id: string) => ['animal-types', 'detail', id] as const,
}

export const listAnimalTypesQuery = queryOptions({
  queryKey: animalTypeQueryKeys.list,
  queryFn: getAnimalTypes,
})

export const getAnimalTypeQuery = (id: string) =>
  queryOptions({
    queryKey: animalTypeQueryKeys.detail(id),
    queryFn: () => getAnimalType(id),
  })
