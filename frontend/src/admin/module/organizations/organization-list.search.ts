import { z } from 'zod'
import {
  createListConfig,
  toListParams,
  type ListParams,
} from '@/components/list/list-query'
import { fixedOrderListSearchShape } from '@/components/list/list-schema'

export const ORGANIZATIONS_PER_PAGE = 25

/**
 * The list's state in the URL. Organizations are searchable but always
 * ordered by name, so there is no sort and no filter. Defaults are stripped
 * from the URL by the route.
 */
export const organizationListSearchSchema = z.object(
  fixedOrderListSearchShape({ searchable: true })
)

export type OrganizationListSearch = z.output<
  typeof organizationListSearchSchema
>

export const organizationListSearchDefaults: OrganizationListSearch = {
  page: 1,
  sort: '',
  search: '',
}

/** What the request depends on: all of the search params. */
export type OrganizationListParams = ListParams<OrganizationListSearch>

const config = createListConfig<OrganizationListSearch, never>({
  noFilters: {},
  perPage: ORGANIZATIONS_PER_PAGE,
  filterKinds: {},
})

export const toOrganizationListParams = (
  search: OrganizationListSearch
): OrganizationListParams => toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildOrganizationListQuery = config.buildQuery

/** True when the search term narrows the list. */
export const hasActiveOrganizationFilters = config.hasActive

/** Search params that clear the search term. */
export const resetSearchPatch = config.resetSearchPatch
