import { queryOptions } from '@tanstack/react-query'
import {
  getOrganization,
  getOrganizations,
  getOrganizationsPage,
} from './requests'
import type { OrganizationListParams } from '../organization-list.search'

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  // Prefix of every list query, so invalidating it covers all pages.
  list: () => [...organizationQueryKeys.all, 'list'] as const,
  page: (params: OrganizationListParams) =>
    [...organizationQueryKeys.list(), 'page', params] as const,
  detail: (id: string) => [...organizationQueryKeys.all, 'detail', id] as const,
}

export const listOrganizationsQuery = queryOptions({
  queryKey: organizationQueryKeys.list(),
  queryFn: getOrganizations,
})

export const listOrganizationsPageQuery = (params: OrganizationListParams) =>
  queryOptions({
    queryKey: organizationQueryKeys.page(params),
    queryFn: () => getOrganizationsPage(params),
  })

export const organizationDetailQuery = (id: string) =>
  queryOptions({
    queryKey: organizationQueryKeys.detail(id),
    queryFn: () => getOrganization(id),
  })
