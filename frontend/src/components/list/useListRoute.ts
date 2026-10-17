import { useEffect } from 'react'
import type { PaginatedResponse } from '@/api/types/pagination'
import { applyListChange } from './list-search'
import { rememberListSearch } from './remembered-list-search'

interface UseListRouteOptions<S extends { page: number }> {
  /** The route's search params. */
  search: S
  navigate: (options: {
    to: '.'
    search: S
    replace: boolean
    resetScroll: boolean
  }) => unknown
  list: PaginatedResponse<unknown> | undefined
  /** Key to remember the last filters under; omit for lists without filters. */
  rememberKey?: string
}

/**
 * The route-side behaviour every list view shares (see
 * docs/coding-patterns/list-views.md): remembering the last filters,
 * leaving a page past the end, and applying search changes to the URL.
 * Returns the callback for the page's `onSearchChange`.
 */
export function useListRoute<S extends { page: number }>({
  search,
  navigate,
  list,
  rememberKey,
}: UseListRouteOptions<S>) {
  // Includes reset states, so clearing the filters is remembered as well.
  // Saved again on leaving, so the time counts from the last visit.
  useEffect(() => {
    if (!rememberKey) return
    rememberListSearch(rememberKey, search)
    return () => rememberListSearch(rememberKey, search)
  }, [rememberKey, search])

  // A page past the end (old link, rows gone meanwhile) shows nothing useful:
  // go to the last page that exists instead.
  const lastPage = list?.meta.last_page
  const pastTheEnd =
    list !== undefined &&
    list.meta.total > 0 &&
    list.meta.current_page > list.meta.last_page
  useEffect(() => {
    if (pastTheEnd && lastPage !== undefined) {
      navigate({
        to: '.',
        search: applyListChange(search, { page: lastPage } as Partial<S>),
        replace: true,
        resetScroll: false,
      })
    }
  }, [pastTheEnd, lastPage, navigate, search])

  return (patch: Partial<S>) => {
    navigate({
      to: '.',
      search: applyListChange(search, patch),
      // Filtering is refinement of one view, not a history of its own.
      replace: true,
      // The list decides itself whether and where to scroll.
      resetScroll: false,
    })
  }
}
