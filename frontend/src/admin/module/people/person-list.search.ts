import { z } from 'zod'
import { LIST_VIEWS } from '@/components/list/list-search'

/** Roles a person can have, see PersonIndexRequest. */
export const PERSON_ROLES = ['inspector', 'foster', 'mediator'] as const
export type PersonRole = (typeof PERSON_ROLES)[number]

/** Status of the adoptions a person applied for; `in_progress` includes pending ones. */
export const PERSON_ADOPTION_STATUSES = [
  'in_progress',
  'done',
  'canceled',
] as const

const SORT_KEYS = [
  'name',
  'organization',
  'city',
  'roles',
  'created_at',
  'updated_at',
] as const

export const PERSON_SORTS = SORT_KEYS.flatMap((key) => [
  key,
  `-${key}` as const,
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

// Invalid or hand-edited values fall back to the default instead of failing
// the whole route.
const multi = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).default([]).catch([])

// Yes/no filters: `1` or `0`, unset means "all".
const yesNo = z.enum(['0', '1']).optional().catch(undefined)

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const personListSearchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  sort: z
    .enum(PERSON_SORTS)
    .default(DEFAULT_PERSON_SORT)
    .catch(DEFAULT_PERSON_SORT),
  // Same limit as the endpoint (PersonIndexRequest), which rejects more.
  search: z.string().trim().max(100).default('').catch(''),
  view: z.enum(LIST_VIEWS).default('table').catch('table'),
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

export function isPersonSort(value: string): value is PersonListSearch['sort'] {
  return (PERSON_SORTS as readonly string[]).includes(value)
}

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
export type PersonListParams = Omit<PersonListSearch, 'view'>

export function toPersonListParams(search: PersonListSearch): PersonListParams {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { view, ...params } = search
  return params
}

const MULTI_FILTERS = ['role', 'adoption_status'] as const
const SINGLE_FILTERS = [
  'organization_id',
  'has_adoptions',
  'has_pre_inspections',
] as const

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export function buildPersonListQuery(
  params: PersonListParams,
  perPage: number = PEOPLE_PER_PAGE
): string {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(perPage),
    sort: params.sort,
  })
  if (params.search.trim()) query.set('search', params.search.trim())
  for (const name of MULTI_FILTERS) {
    if (params[name].length > 0) {
      query.set(`filter[${name}]`, params[name].join(','))
    }
  }
  for (const name of SINGLE_FILTERS) {
    const value = params[name]
    if (value) query.set(`filter[${name}]`, value)
  }
  return query.toString()
}

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export function hasActivePersonFilters(search: PersonListSearch): boolean {
  return (
    search.search.trim() !== '' ||
    MULTI_FILTERS.some((name) => search[name].length > 0) ||
    SINGLE_FILTERS.some((name) => Boolean(search[name]))
  )
}

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch: Partial<PersonListSearch> = {
  ...NO_FILTERS,
  search: '',
}
