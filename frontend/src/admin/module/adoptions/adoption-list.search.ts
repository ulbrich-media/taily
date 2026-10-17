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
} from '@/components/list/list-schema'

export const ADOPTION_STATUSES = [
  'pending',
  'in_progress',
  'canceled',
  'done',
] as const
export const STEP_STATUSES = ['not_started', 'pending', 'finished'] as const
export const HANDOVER_STATUSES = ['not_started', 'finished'] as const

export const ADOPTION_SORTS = sortsFor([
  'created_at',
  'updated_at',
  'animal_name',
  'applicant_name',
  'mediator_name',
])

export const DEFAULT_ADOPTION_SORT = '-created_at'
export const ADOPTIONS_PER_PAGE = 25

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const adoptionListSearchSchema = z.object({
  ...baseListSearchShape({
    sorts: ADOPTION_SORTS,
    defaultSort: DEFAULT_ADOPTION_SORT,
  }),
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

export const isAdoptionSort = sortGuard(ADOPTION_SORTS)

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
  ...NO_FILTERS,
}

/** What the request depends on: all of the search params. */
export type AdoptionListParams = ListParams<AdoptionListSearch>

const config = createListConfig<AdoptionListSearch, AdoptionFilterKey>({
  noFilters: NO_FILTERS,
  perPage: ADOPTIONS_PER_PAGE,
  filterKinds: {
    status: 'multi',
    pre_inspection_status: 'multi',
    contract_status: 'multi',
    transport_status: 'multi',
    handover_status: 'multi',
    mediator_id: 'single',
    animal_type_id: 'single',
  },
})

export const toAdoptionListParams = (
  search: AdoptionListSearch
): AdoptionListParams => toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildAdoptionListQuery = config.buildQuery

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export const hasActiveAdoptionFilters = config.hasActive

/**
 * Search params that clear the search term and every filter. Sort and view
 * are left out on purpose: a patch only changes what it names.
 */
export const resetSearchPatch = config.resetSearchPatch
