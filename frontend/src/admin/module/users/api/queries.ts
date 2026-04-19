import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { getUsers } from './requests'

export const userQueryKeys: Record<string, QueryKey> = {
  all: ['users'],
  list: ['users', 'list'],
}

export const listUsersQuery = queryOptions({
  queryFn: getUsers,
  queryKey: userQueryKeys.list,
})
