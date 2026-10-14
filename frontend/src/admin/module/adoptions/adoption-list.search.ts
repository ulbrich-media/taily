import { z } from 'zod'
import { LIST_VIEWS } from '@/components/list/list-search'

export const ADOPTION_STATUSES = [
  'pending',
  'in_progress',
  'canceled',
  'done',
] as const
export const STEP_STATUSES = ['not_started', 'pending', 'finished'] as const
export const HANDOVER_STATUSES = ['not_started', 'finished'] as const

const SORT_KEYS = [
  'created_at',
  'updated_at',
  'animal_name',
  'applicant_name',
  'mediator_name',
] as const

export const ADOPTION_SORTS = SORT_KEYS.flatMap((key) => [
  key,
  `-${key}` as const,
])

export const DEFAULT_ADOPTION_SORT = '-created_at'
export const ADOPTIONS_PER_PAGE = 25

// Invalid or hand-edited values fall back to the default instead of failing
// the whole route.
const multi = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).default([]).catch([])

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const adoptionListSearchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  sort: z
    .enum(ADOPTION_SORTS)
    .default(DEFAULT_ADOPTION_SORT)
    .catch(DEFAULT_ADOPTION_SORT),
  // Same limit as the endpoint (AdoptionIndexRequest), which rejects more.
  search: z.string().trim().max(100).default('').catch(''),
  view: z.enum(LIST_VIEWS).default('table').catch('table'),
  status: multi(ADOPTION_STATUSES),
  // A person id, or `none` for adoptions without a mediator.
  mediator_id: z
    .union([z.literal('none'), z.uuid()])
    .optional()
    .catch(undefined),
  animal_type_id: z.uuid().optional().catch(undefined),
  pre_inspection_status: multi(STEP_STATUSES),
  contract_status: multi(STEP_STATUSES),
  transport_status: multi(STEP_STATUSES),
  handover_status: multi(HANDOVER_STATUSES),
})

export type AdoptionListSearch = z.output<typeof adoptionListSearchSchema>

export function isAdoptionSort(
  value: string
): value is AdoptionListSearch['sort'] {
  return (ADOPTION_SORTS as readonly string[]).includes(value)
}

// Every filter at its empty value. Listing each key makes the compiler ask
// for a new filter here, which presets and reset rely on.
export const NO_FILTERS: {
  [K in AdoptionFilterKey]: AdoptionListSearch[K]
} = {
  status: [],
  mediator_id: undefined,
  animal_type_id: undefined,
  pre_inspection_status: [],
  contract_status: [],
  transport_status: [],
  handover_status: [],
}

export const adoptionListSearchDefaults: AdoptionListSearch = {
  page: 1,
  sort: DEFAULT_ADOPTION_SORT,
  search: '',
  view: 'table',
  ...NO_FILTERS,
}

/** What the request depends on: the search params without presentation-only ones. */
export type AdoptionListParams = Omit<AdoptionListSearch, 'view'>

export function toAdoptionListParams(
  search: AdoptionListSearch
): AdoptionListParams {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { view, ...params } = search
  return params
}

/** The params that narrow the list, as opposed to search, sort, view and page. */
export const FILTER_KEYS = [
  'status',
  'mediator_id',
  'animal_type_id',
  'pre_inspection_status',
  'contract_status',
  'transport_status',
  'handover_status',
] as const satisfies readonly (keyof AdoptionListSearch)[]

export type AdoptionFilterKey = (typeof FILTER_KEYS)[number]

const MULTI_FILTERS = [
  'status',
  'pre_inspection_status',
  'contract_status',
  'transport_status',
  'handover_status',
] as const

const SINGLE_FILTERS = ['mediator_id', 'animal_type_id'] as const

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export function buildAdoptionListQuery(params: AdoptionListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(ADOPTIONS_PER_PAGE),
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
export function hasActiveAdoptionFilters(search: AdoptionListSearch): boolean {
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
export const resetSearchPatch: Partial<AdoptionListSearch> = {
  ...NO_FILTERS,
  search: '',
}
