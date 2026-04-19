import { queryOptions } from '@tanstack/react-query'
import { getAdoptions, getAdoption, type AdoptionsFilters } from './requests'

export const adoptionQueryKeys = {
  all: ['adoptions'] as const,
  list: (filters?: AdoptionsFilters) =>
    filters
      ? (['adoptions', 'list', filters] as const)
      : (['adoptions', 'list'] as const),
  detail: (id: string) => ['adoptions', 'detail', id] as const,
}

export const listAdoptionsQuery = (filters?: AdoptionsFilters) =>
  queryOptions({
    queryKey: adoptionQueryKeys.list(filters),
    queryFn: () => getAdoptions(filters),
  })

export const getAdoptionQuery = (id: string) =>
  queryOptions({
    queryKey: adoptionQueryKeys.detail(id),
    queryFn: () => getAdoption(id),
  })
