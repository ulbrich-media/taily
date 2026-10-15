import { z } from 'zod'
import {
  createListConfig,
  toListParams,
  type ListParams,
} from '@/components/list/list-query'
import {
  baseListSearchShape,
  multi,
  sortGuard,
  sortsFor,
  yesNo,
} from '@/components/list/list-schema'

/** Roles a user can have, see UserIndexRequest. */
export const USER_ROLES = ['admin', 'user'] as const
export type UserListRole = (typeof USER_ROLES)[number]

// `last_login_at` is only allowed for admins, who are the only ones seeing it.
export const USER_SORTS = sortsFor([
  'name',
  'email',
  'last_login_at',
  'created_at',
])

export const DEFAULT_USER_SORT = 'name'
export const USERS_PER_PAGE = 25

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const userListSearchSchema = z.object({
  ...baseListSearchShape({
    sorts: USER_SORTS,
    defaultSort: DEFAULT_USER_SORT,
  }),
  role: multi(USER_ROLES),
  has_person: yesNo,
  // The next two are admin-only, the API rejects them for everyone else.
  has_two_factor: yesNo,
  has_logged_in: yesNo,
})

export type UserListSearch = z.output<typeof userListSearchSchema>

export const isUserSort = sortGuard(USER_SORTS)

/** The params that narrow the list, as opposed to search, sort, view and page. */
export const FILTER_KEYS = [
  'role',
  'has_person',
  'has_two_factor',
  'has_logged_in',
] as const satisfies readonly (keyof UserListSearch)[]

export type UserFilterKey = (typeof FILTER_KEYS)[number]

// Every filter at its empty value. Listing each key makes the compiler ask
// for a new filter here, which reset relies on.
export const NO_FILTERS: {
  [K in UserFilterKey]: UserListSearch[K]
} = {
  role: [],
  has_person: undefined,
  has_two_factor: undefined,
  has_logged_in: undefined,
}

export const userListSearchDefaults: UserListSearch = {
  page: 1,
  sort: DEFAULT_USER_SORT,
  search: '',
  view: 'table',
  ...NO_FILTERS,
}

/** What the request depends on: the search params without presentation-only ones. */
export type UserListParams = ListParams<UserListSearch>

const config = createListConfig<UserListSearch, UserFilterKey>({
  noFilters: NO_FILTERS,
  perPage: USERS_PER_PAGE,
  filterKinds: {
    role: 'multi',
    has_person: 'single',
    has_two_factor: 'single',
    has_logged_in: 'single',
  },
})

export const toUserListParams = (search: UserListSearch): UserListParams =>
  toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildUserListQuery = config.buildQuery

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export const hasActiveUserFilters = config.hasActive

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch = config.resetSearchPatch
