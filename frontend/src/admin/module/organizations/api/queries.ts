import { queryOptions } from '@tanstack/react-query'
import { getOrganization, getOrganizations } from './requests'

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...organizationQueryKeys.all, 'detail', id] as const,
}

export const listOrganizationsQuery = queryOptions({
  queryKey: organizationQueryKeys.list(),
  queryFn: getOrganizations,
})

export const organizationDetailQuery = (id: string) =>
  queryOptions({
    queryKey: organizationQueryKeys.detail(id),
    queryFn: () => getOrganization(id),
  })
