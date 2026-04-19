import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { getPersons } from './requests'

export const personQueryKeys: Record<string, QueryKey> = {
  all: ['persons'],
  list: ['persons', 'list'],
}

export const listPersonsQuery = queryOptions({
  queryFn: getPersons,
  queryKey: personQueryKeys.list,
})
