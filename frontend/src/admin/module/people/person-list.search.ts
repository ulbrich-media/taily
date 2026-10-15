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

/** Roles a person can have, see PersonIndexRequest. */
export const PERSON_ROLES = ['inspector', 'foster', 'mediator'] as const
export type PersonRole = (typeof PERSON_ROLES)[number]

/** Status of the adoptions a person applied for; `in_progress` includes pending ones. */
export const PERSON_ADOPTION_STATUSES = [
  'in_progress',
  'done',
  'canceled',
] as const

export const PERSON_SORTS = sortsFor([
  'name',
  'organization',
  'city',
  'roles',
  'created_at',
  'updated_at',
])

export const DEFAULT_PERSON_SORT = 'name'
export const PEOPLE_PER_PAGE = 25

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `none`, a role, or a role for one animal type (`mediator:<animal type id>`). */
export function isRoleValue(value: string): boolean {
  if (value === 'none') return true
  const [role, animalTypeId, ...rest] = value.split(':')
  return (
    rest.length === 0 &&
    (PERSON_ROLES as readonly string[]).includes(role) &&
    (animalTypeId === undefined || UUID.test(animalTypeId))
  )
}

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const personListSearchSchema = z.object({
  ...baseListSearchShape({
    sorts: PERSON_SORTS,
    defaultSort: DEFAULT_PERSON_SORT,
  }),
  // Sorted, so the same selection always gives the same URL.
  role: z
    .array(z.string().refine(isRoleValue))
    .default([])
    .catch([])
    .transform((roles) => [...roles].sort()),
  // An organization id, or `none` for people without one.
  organization_id: z
    .union([z.literal('none'), z.uuid()])
    .optional()
    .catch(undefined),
  has_adoptions: yesNo,
  has_pre_inspections: yesNo,
  adoption_status: multi(PERSON_ADOPTION_STATUSES),
})

export type PersonListSearch = z.output<typeof personListSearchSchema>

export const isPersonSort = sortGuard(PERSON_SORTS)

/** The params that narrow the list, as opposed to search, sort, view and page. */
export const FILTER_KEYS = [
  'role',
  'organization_id',
  'has_adoptions',
  'has_pre_inspections',
  'adoption_status',
] as const satisfies readonly (keyof PersonListSearch)[]

export type PersonFilterKey = (typeof FILTER_KEYS)[number]

// Every filter at its empty value. Listing each key makes the compiler ask
// for a new filter here, which reset relies on.
export const NO_FILTERS: {
  [K in PersonFilterKey]: PersonListSearch[K]
} = {
  role: [],
  organization_id: undefined,
  has_adoptions: undefined,
  has_pre_inspections: undefined,
  adoption_status: [],
}

export const personListSearchDefaults: PersonListSearch = {
  page: 1,
  sort: DEFAULT_PERSON_SORT,
  search: '',
  view: 'table',
  ...NO_FILTERS,
}

/** What the request depends on: the search params without presentation-only ones. */
export type PersonListParams = ListParams<PersonListSearch>

const config = createListConfig<PersonListSearch, PersonFilterKey>({
  noFilters: NO_FILTERS,
  perPage: PEOPLE_PER_PAGE,
  multi: ['role', 'adoption_status'],
  single: ['organization_id', 'has_adoptions', 'has_pre_inspections'],
})

export const toPersonListParams = (
  search: PersonListSearch
): PersonListParams => toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildPersonListQuery = config.buildQuery

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export const hasActivePersonFilters = config.hasActive

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch = config.resetSearchPatch
