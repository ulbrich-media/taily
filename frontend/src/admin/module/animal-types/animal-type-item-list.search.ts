// Shared by the vaccination and the medical test list: both are one merged
// list of items that belong to an animal type, grouped by it and ordered by
// title, so there is no sort and no search, only the animal type filter.
import { z } from 'zod'
import {
  createListConfig,
  toListParams,
  type ListParams,
} from '@/components/list/list-query'
import { fixedOrderListSearchShape } from '@/components/list/list-schema'

export const ANIMAL_TYPE_ITEMS_PER_PAGE = 25

/** The list's state in the URL. Defaults are stripped from the URL by the route. */
export const animalTypeItemListSearchSchema = z.object({
  ...fixedOrderListSearchShape(),
  animal_type_id: z.uuid().optional().catch(undefined),
})

export type AnimalTypeItemListSearch = z.output<
  typeof animalTypeItemListSearchSchema
>

/** The params that narrow the list, as opposed to page and view. */
export const NO_FILTERS: {
  [K in 'animal_type_id']: AnimalTypeItemListSearch[K]
} = {
  animal_type_id: undefined,
}

export const animalTypeItemListSearchDefaults: AnimalTypeItemListSearch = {
  page: 1,
  sort: '',
  search: '',
  ...NO_FILTERS,
}

/** What the request depends on: the search params without presentation-only ones. */
export type AnimalTypeItemListParams = ListParams<AnimalTypeItemListSearch>

const config = createListConfig<AnimalTypeItemListSearch, 'animal_type_id'>({
  noFilters: NO_FILTERS,
  perPage: ANIMAL_TYPE_ITEMS_PER_PAGE,
  filterKinds: { animal_type_id: 'single' },
})

export const toAnimalTypeItemListParams = (
  search: AnimalTypeItemListSearch
): AnimalTypeItemListParams => toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildAnimalTypeItemListQuery = config.buildQuery

/** True when a filter narrows the list. */
export const hasActiveAnimalTypeItemFilters = config.hasActive

/** Search params that clear every filter. */
export const resetSearchPatch = config.resetSearchPatch
