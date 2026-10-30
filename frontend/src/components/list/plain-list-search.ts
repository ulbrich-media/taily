// URL state of the lists that only page through their rows in a fixed order,
// without search, filters or sorting (animal types, form templates).
import { z } from 'zod'
import { createListConfig, toListParams, type ListParams } from './list-query'
import { fixedOrderListSearchShape } from './list-schema'

export const PLAIN_LIST_PER_PAGE = 25

export const plainListSearchSchema = z.object(fixedOrderListSearchShape())

export type PlainListSearch = z.output<typeof plainListSearchSchema>

export const plainListSearchDefaults: PlainListSearch = {
  page: 1,
  sort: '',
  search: '',
}

/** What the request depends on: all of the search params. */
export type PlainListParams = ListParams<PlainListSearch>

const config = createListConfig<PlainListSearch, never>({
  noFilters: {},
  perPage: PLAIN_LIST_PER_PAGE,
  filterKinds: {},
})

export const toPlainListParams = (search: PlainListSearch): PlainListParams =>
  toListParams(search)

/** Query string of the list endpoint, see docs/coding-patterns/list-views.md. */
export const buildPlainListQuery = config.buildQuery
