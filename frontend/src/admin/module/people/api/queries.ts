import { queryOptions } from '@tanstack/react-query'
import {
  getPeople,
  getPeoplePage,
  getPerson,
  type GetPeopleParams,
} from './requests'
import type { PersonListParams } from '../person-list.search'

export const personQueryKeys = {
  all: ['people'] as const,
  // Prefix of every list query, so invalidating it covers all of them.
  list: ['people', 'list'] as const,
  filtered: (params: GetPeopleParams) => ['people', 'list', params] as const,
  page: (params: PersonListParams, perPage?: number) =>
    ['people', 'list', 'page', params, perPage] as const,
  detail: (id: string) => ['people', 'detail', id] as const,
}

export const listPeopleQuery = queryOptions({
  queryKey: personQueryKeys.list,
  queryFn: () => getPeople(),
})

export const listPeopleFilteredQuery = (params: GetPeopleParams) =>
  queryOptions({
    queryKey: personQueryKeys.filtered(params),
    queryFn: () => getPeople(params),
  })

/** One page of the people list; pass `perPage` for small pages, e.g. in pickers. */
export const listPeoplePageQuery = (
  params: PersonListParams,
  perPage?: number
) =>
  queryOptions({
    queryKey: personQueryKeys.page(params, perPage),
    queryFn: () => getPeoplePage(params, perPage),
  })

export const getPersonQuery = (id: string) =>
  queryOptions({
    queryKey: personQueryKeys.detail(id),
    queryFn: () => getPerson(id),
  })
