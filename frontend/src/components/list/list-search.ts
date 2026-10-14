// URL state helpers shared by the paginated list views
// (see docs/coding-patterns/list-views.md).

export type SortDirection = 'asc' | 'desc'

export const LIST_VIEWS = ['table', 'cards'] as const
export type ListView = (typeof LIST_VIEWS)[number]

/**
 * Classes that pick the renderer: cards are always used below `lg`, the
 * table only from `lg` up. Both are in the DOM and CSS decides, so small
 * screens need no JS media query.
 */
export function listViewVisibility(view: ListView) {
  return {
    table: view === 'table' ? 'hidden lg:block' : 'hidden',
    cards: view === 'table' ? 'lg:hidden' : '',
  }
}

/** Direction of `sortKey` in the current sort value, or null if not sorted by it. */
export function sortDirectionOf(
  sort: string,
  sortKey: string
): SortDirection | null {
  if (sort === sortKey) return 'asc'
  if (sort === `-${sortKey}`) return 'desc'
  return null
}

/** Sort value after clicking the header of `sortKey`: asc ↔ desc, first click uses `firstDirection`. */
export function nextSort(
  sort: string,
  sortKey: string,
  firstDirection: SortDirection = 'asc'
): string {
  const current = sortDirectionOf(sort, sortKey)
  const next =
    current === null ? firstDirection : current === 'asc' ? 'desc' : 'asc'
  return next === 'desc' ? `-${sortKey}` : sortKey
}

/**
 * Applies a change to the list's search params. Any change except to the page
 * itself resets the page to 1.
 */
export function applyListChange<T extends { page: number }>(
  search: T,
  patch: Partial<T>
): T {
  return { ...search, page: 1, ...patch }
}
