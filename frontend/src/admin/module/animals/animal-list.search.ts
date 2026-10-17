import { z } from 'zod'
import {
  createListConfig,
  toListParams,
  type ListParams,
} from '@/components/list/list-query'
import {
  baseListSearchShape,
  multi,
  only,
  sortGuard,
  sortsFor,
  yesNo,
} from '@/components/list/list-schema'

/** Derived from the animal's adoptions, see AnimalIndexRequest. */
export const ANIMAL_STATUSES = ['open', 'in_progress', 'adopted'] as const

export const ANIMAL_SORTS = sortsFor([
  'name',
  'breed',
  'color',
  'created_at',
  'updated_at',
  'date_of_birth',
  'animal_number',
])

export const DEFAULT_ANIMAL_SORT = '-created_at'
export const ANIMALS_PER_PAGE = 25

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const animalListSearchSchema = z.object({
  ...baseListSearchShape({
    sorts: ANIMAL_SORTS,
    defaultSort: DEFAULT_ANIMAL_SORT,
  }),
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

export const isAnimalSort = sortGuard(ANIMAL_SORTS)

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
  ...NO_FILTERS,
}

/** What the request depends on: all of the search params. */
export type AnimalListParams = ListParams<AnimalListSearch>

const config = createListConfig<AnimalListSearch, AnimalFilterKey>({
  noFilters: NO_FILTERS,
  perPage: ANIMALS_PER_PAGE,
  filterKinds: {
    status: 'multi',
    animal_type_id: 'single',
    assigned_agent_id: 'single',
    published: 'single',
    neutered: 'single',
    has_image: 'single',
    boarding: 'single',
    reserved: 'single',
    has_sponsor: 'single',
  },
})

export const toAnimalListParams = (
  search: AnimalListSearch
): AnimalListParams => toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildAnimalListQuery = config.buildQuery

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export const hasActiveAnimalFilters = config.hasActive

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch = config.resetSearchPatch
