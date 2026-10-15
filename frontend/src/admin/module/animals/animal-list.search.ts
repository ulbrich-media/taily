import { z } from 'zod'
import { LIST_VIEWS } from '@/components/list/list-search'

/** Derived from the animal's adoptions, see AnimalIndexRequest. */
export const ANIMAL_STATUSES = ['open', 'in_progress', 'adopted'] as const

const SORT_KEYS = [
  'name',
  'breed',
  'color',
  'created_at',
  'updated_at',
  'date_of_birth',
  'animal_number',
] as const

export const ANIMAL_SORTS = SORT_KEYS.flatMap((key) => [
  key,
  `-${key}` as const,
])

export const DEFAULT_ANIMAL_SORT = '-created_at'
export const ANIMALS_PER_PAGE = 25

// Invalid or hand-edited values fall back to the default instead of failing
// the whole route.
const multi = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).default([]).catch([])

// Yes/no filters: `1` or `0`, unset means "all".
const yesNo = z.enum(['0', '1']).optional().catch(undefined)
// "Only" flags: `1` or unset.
const only = z.literal('1').optional().catch(undefined)

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const animalListSearchSchema = z.object({
  page: z.number().int().min(1).default(1).catch(1),
  sort: z
    .enum(ANIMAL_SORTS)
    .default(DEFAULT_ANIMAL_SORT)
    .catch(DEFAULT_ANIMAL_SORT),
  // Same limit as the endpoint (AnimalIndexRequest), which rejects more.
  search: z.string().trim().max(100).default('').catch(''),
  view: z.enum(LIST_VIEWS).default('table').catch('table'),
  animal_type_id: z.uuid().optional().catch(undefined),
  status: multi(ANIMAL_STATUSES),
  // A person id, or `none` for animals without an assigned member.
  assigned_agent_id: z
    .union([z.literal('none'), z.uuid()])
    .optional()
    .catch(undefined),
  published: yesNo,
  neutered: yesNo,
  has_image: yesNo,
  boarding: only,
  reserved: only,
  has_sponsor: only,
})

export type AnimalListSearch = z.output<typeof animalListSearchSchema>

export function isAnimalSort(value: string): value is AnimalListSearch['sort'] {
  return (ANIMAL_SORTS as readonly string[]).includes(value)
}

// Every filter at its empty value. Listing each key makes the compiler ask
// for a new filter here, which reset relies on.
export const NO_FILTERS: {
  [K in AnimalFilterKey]: AnimalListSearch[K]
} = {
  animal_type_id: undefined,
  status: [],
  assigned_agent_id: undefined,
  published: undefined,
  neutered: undefined,
  has_image: undefined,
  boarding: undefined,
  reserved: undefined,
  has_sponsor: undefined,
}

export const animalListSearchDefaults: AnimalListSearch = {
  page: 1,
  sort: DEFAULT_ANIMAL_SORT,
  search: '',
  view: 'table',
  ...NO_FILTERS,
}

/** What the request depends on: the search params without presentation-only ones. */
export type AnimalListParams = Omit<AnimalListSearch, 'view'>

export function toAnimalListParams(search: AnimalListSearch): AnimalListParams {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { view, ...params } = search
  return params
}

/** The params that narrow the list, as opposed to search, sort, view and page. */
export const FILTER_KEYS = [
  'animal_type_id',
  'status',
  'assigned_agent_id',
  'published',
  'neutered',
  'has_image',
  'boarding',
  'reserved',
  'has_sponsor',
] as const satisfies readonly (keyof AnimalListSearch)[]

export type AnimalFilterKey = (typeof FILTER_KEYS)[number]

const SINGLE_FILTERS = [
  'animal_type_id',
  'assigned_agent_id',
  'published',
  'neutered',
  'has_image',
  'boarding',
  'reserved',
  'has_sponsor',
] as const

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export function buildAnimalListQuery(
  params: AnimalListParams,
  perPage: number = ANIMALS_PER_PAGE
): string {
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(perPage),
    sort: params.sort,
  })
  if (params.search.trim()) query.set('search', params.search.trim())
  if (params.status.length > 0) {
    query.set('filter[status]', params.status.join(','))
  }
  for (const name of SINGLE_FILTERS) {
    const value = params[name]
    if (value) query.set(`filter[${name}]`, value)
  }
  return query.toString()
}

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export function hasActiveAnimalFilters(search: AnimalListSearch): boolean {
  return (
    search.search.trim() !== '' ||
    search.status.length > 0 ||
    SINGLE_FILTERS.some((name) => Boolean(search[name]))
  )
}

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch: Partial<AnimalListSearch> = {
  ...NO_FILTERS,
  search: '',
}
