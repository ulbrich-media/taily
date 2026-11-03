import { queryOptions } from '@tanstack/react-query'
import {
  getAdoptions,
  getAdoptionsPage,
  getAdoption,
  getContractTemplates,
  getRelatedAdoptions,
  type AdoptionsFilters,
} from './requests'
import type { AdoptionListParams } from '../adoption-list.search'

export const adoptionQueryKeys = {
  all: ['adoptions'] as const,
  list: (filters?: AdoptionsFilters) =>
    filters
      ? (['adoptions', 'list', filters] as const)
      : (['adoptions', 'list'] as const),
  // Shares the `['adoptions', 'list']` prefix so list invalidation covers it.
  page: (params: AdoptionListParams) =>
    ['adoptions', 'list', 'page', params] as const,
  detail: (id: string) => ['adoptions', 'detail', id] as const,
  related: (id: string) => ['adoptions', 'detail', id, 'related'] as const,
  contractTemplates: (id: string) =>
    ['adoptions', 'detail', id, 'contract-templates'] as const,
}

export const listAdoptionsQuery = (filters?: AdoptionsFilters) =>
  queryOptions({
    queryKey: adoptionQueryKeys.list(filters),
    queryFn: () => getAdoptions(filters),
  })

export const listAdoptionsPageQuery = (params: AdoptionListParams) =>
  queryOptions({
    queryKey: adoptionQueryKeys.page(params),
    queryFn: () => getAdoptionsPage(params),
  })

export const getAdoptionQuery = (id: string) =>
  queryOptions({
    queryKey: adoptionQueryKeys.detail(id),
    queryFn: () => getAdoption(id),
  })

export const getContractTemplatesQuery = (id: string) =>
  queryOptions({
    queryKey: adoptionQueryKeys.contractTemplates(id),
    queryFn: () => getContractTemplates(id),
  })

export const getRelatedAdoptionsQuery = (id: string) =>
  queryOptions({
    queryKey: adoptionQueryKeys.related(id),
    queryFn: () => getRelatedAdoptions(id),
  })
