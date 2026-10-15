import { apiRequest } from '@/lib/api'
import type { OrganizationResource } from '@/api/types/organizations'
import type { PaginatedResponse } from '@/api/types/pagination'
import {
  buildOrganizationListQuery,
  type OrganizationListParams,
} from '../organization-list.search'
import type {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
} from './types'

export async function getOrganizations(): Promise<OrganizationResource[]> {
  return apiRequest('organizations')
}

/** One page of the organization list, see docs/coding-patterns/list-views.md. */
export async function getOrganizationsPage(
  params: OrganizationListParams
): Promise<PaginatedResponse<OrganizationResource>> {
  return apiRequest(`organizations?${buildOrganizationListQuery(params)}`)
}

export async function getOrganization(
  id: string
): Promise<OrganizationResource> {
  return apiRequest(`organizations/${id}`)
}

export async function createOrganization(
  data: CreateOrganizationRequest
): Promise<{ message: string; data: OrganizationResource }> {
  return apiRequest('organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateOrganization(
  id: string,
  data: UpdateOrganizationRequest
): Promise<{ message: string; data: OrganizationResource }> {
  return apiRequest(`organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteOrganization(
  id: string
): Promise<{ message: string }> {
  return apiRequest(`organizations/${id}`, {
    method: 'DELETE',
  })
}
