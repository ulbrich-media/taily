import { type QueryKey, queryOptions } from '@tanstack/react-query'
import { getUsers, getUsersPage } from './requests'
import type { UserListParams } from '../user-list.search'

export const userQueryKeys: {
  all: QueryKey
  // Prefix of every list query, so invalidating it covers all pages.
  list: QueryKey
  page: (params: UserListParams) => QueryKey
} = {
  all: ['users'],
  list: ['users', 'list'],
  page: (params) => ['users', 'list', 'page', params],
}

export const listUsersQuery = queryOptions({
  queryFn: getUsers,
  queryKey: userQueryKeys.list,
})

export const listUsersPageQuery = (params: UserListParams) =>
  queryOptions({
    queryFn: () => getUsersPage(params),
    queryKey: userQueryKeys.page(params),
  })
