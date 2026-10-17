// Request and reset logic shared by the list views
// (see docs/coding-patterns/list-views.md).
import type { ListView } from './list-search'

/** The state every list has in the URL. */
export interface BaseListSearch {
  page: number
  sort: string
  search: string
  view: ListView
}

/** What the request depends on: the search params without presentation-only ones. */
export type ListParams<S extends BaseListSearch> = Omit<S, 'view'>

/** Which filters are sent as `filter[x]=a,b` (multi) or `filter[x]=a` (single). */
export interface FilterQueryConfig<S> {
  multi: readonly (keyof S & string)[]
  single: readonly (keyof S & string)[]
}

export function toListParams<S extends BaseListSearch>(
  search: S
): ListParams<S> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { view, ...params } = search
  return params
}

/** Query string of the list endpoint. */
export function buildListQuery<S extends BaseListSearch>(
  params: ListParams<S>,
  perPage: number,
  config: FilterQueryConfig<S>
): string {
  const values = params as unknown as Record<string, unknown>
  const query = new URLSearchParams({
    page: String(params.page),
    per_page: String(perPage),
  })
  // Lists with a fixed order have no sort value and send none.
  if (params.sort) query.set('sort', params.sort)
  if (params.search.trim()) query.set('search', params.search.trim())
  for (const name of config.multi) {
    const value = values[name] as string[]
    if (value.length > 0) query.set(`filter[${name}]`, value.join(','))
  }
  for (const name of config.single) {
    const value = values[name]
    if (value) query.set(`filter[${name}]`, String(value))
  }
  return query.toString()
}

/** True when any filter or the search term narrows the list. Sort and view do not count. */
export function hasActiveFilters<S extends BaseListSearch>(
  search: S,
  config: FilterQueryConfig<S>
): boolean {
  const values = search as unknown as Record<string, unknown>
  return (
    search.search.trim() !== '' ||
    config.multi.some((name) => (values[name] as unknown[]).length > 0) ||
    config.single.some((name) => Boolean(values[name]))
  )
}

/**
 * Everything a list module needs from its filter description. `noFilters`
 * and `filterKinds` must each name every filter key (at its empty value, and
 * as `multi` or `single`), so the compiler asks for a new filter in both.
 */
export function createListConfig<
  S extends BaseListSearch,
  K extends keyof S & string,
>(options: {
  noFilters: { [P in K]: S[P] }
  perPage: number
  filterKinds: { [P in K]: 'multi' | 'single' }
}) {
  const { noFilters, perPage, filterKinds } = options
  const entries = Object.entries(filterKinds) as [K, 'multi' | 'single'][]
  const config: FilterQueryConfig<S> = {
    multi: entries.filter(([, kind]) => kind === 'multi').map(([key]) => key),
    single: entries.filter(([, kind]) => kind === 'single').map(([key]) => key),
  }
  return {
    perPage,
    /**
     * Search params that clear the search term and every filter. Sort and view
     * are left out on purpose: a patch only changes what it names.
     */
    resetSearchPatch: { ...noFilters, search: '' } as unknown as Partial<S>,
    buildQuery: (params: ListParams<S>, pageSize: number = perPage) =>
      buildListQuery<S>(params, pageSize, config),
    hasActive: (search: S) => hasActiveFilters(search, config),
  }
}
