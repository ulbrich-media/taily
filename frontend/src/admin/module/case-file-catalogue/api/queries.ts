import { queryOptions } from '@tanstack/react-query'
import { getCatalogue } from './requests'

export const catalogueQueryKeys = {
  all: ['catalogue'] as const,
  detail: (animalTypeId: string) => ['catalogue', animalTypeId] as const,
}

export const getCatalogueQuery = (animalTypeId: string) =>
  queryOptions({
    queryKey: catalogueQueryKeys.detail(animalTypeId),
    queryFn: () => getCatalogue(animalTypeId),
  })
