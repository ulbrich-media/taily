import { queryOptions } from '@tanstack/react-query'
import { getPeople, getPerson, type GetPeopleParams } from './requests'

export const personQueryKeys = {
  all: ['people'] as const,
  list: ['people', 'list'] as const,
  filtered: (params: GetPeopleParams) => ['people', 'list', params] as const,
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

export const getPersonQuery = (id: string) =>
  queryOptions({
    queryKey: personQueryKeys.detail(id),
    queryFn: () => getPerson(id),
  })
