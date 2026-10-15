import type { ComponentType, ReactNode } from 'react'
import { FilterX } from 'lucide-react'
import type { PaginatedResponse } from '@/api/types/pagination'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableCard } from '@/components/card/TableCard'
import { ProgressBar } from '@/components/list/ProgressBar'
import {
  listViewVisibility,
  type ListView,
} from '@/components/list/list-search'
import { useScrollListIntoView } from '@/components/list/useScrollListIntoView'
import { updatingClass } from '@/components/list/updating'
import { ListPagination } from '@/components/list/ListPagination'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shadcn/components/ui/empty'
import { Button } from '@/shadcn/components/ui/button'
import { cn } from '@/shadcn/lib/utils'

interface ListPageProps<T> {
  title: string
  description: string
  breadcrumb?: ReactNode
  createAction?: ReactNode
  /** The filter toolbar, rendered above the list. */
  toolbar: ReactNode
  list: PaginatedResponse<T>
  view: ListView
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onPageChange: (page: number) => void
  /** Plural noun for the pagination, e.g. "Tiere". */
  itemLabel: string
  empty: {
    icon: ComponentType
    title: string
    /** Shown when filters or a search term are active. */
    descriptionFiltered: string
    /** Shown when the list is empty without any filter. */
    descriptionEmpty: string
    filtered: boolean
    onReset: () => void
  }
  renderTable: (items: T[]) => ReactNode
  renderCards: (items: T[], className?: string) => ReactNode
}

/** Page shell shared by the filterable lists: header, toolbar, table/cards, empty state, paging. */
export function ListPage<T>({
  title,
  description,
  breadcrumb,
  createAction,
  toolbar,
  list,
  view,
  isUpdating = false,
  onPageChange,
  itemLabel,
  empty,
  renderTable,
  renderCards,
}: ListPageProps<T>) {
  const { data, meta } = list
  const { ref: listRef, scrollIfNeeded } =
    useScrollListIntoView<HTMLDivElement>()
  const visibility = listViewVisibility(view)
  const EmptyIcon = empty.icon

  // The pagination sits below the list: see useScrollListIntoView.
  const handlePageChange = (page: number) => {
    scrollIfNeeded()
    onPageChange(page)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={createAction}
        breadcrumb={breadcrumb}
      />

      {/* scroll-mt clears the sticky header when scrolled into view */}
      <div ref={listRef} className="scroll-mt-24 space-y-4">
        {toolbar}

        <div className="space-y-4">
          {data.length === 0 ? (
            <div className="relative">
              <ProgressBar
                loading={isUpdating}
                className="absolute inset-x-0 top-0"
              />
              <Empty className={cn(isUpdating && updatingClass)}>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <EmptyIcon />
                  </EmptyMedia>
                  <EmptyTitle>{empty.title}</EmptyTitle>
                  <EmptyDescription>
                    {empty.filtered
                      ? empty.descriptionFiltered
                      : empty.descriptionEmpty}
                  </EmptyDescription>
                </EmptyHeader>
                {empty.filtered && (
                  <EmptyContent>
                    <Button variant="outline" onClick={empty.onReset}>
                      <FilterX />
                      Filter zurücksetzen
                    </Button>
                  </EmptyContent>
                )}
              </Empty>
            </div>
          ) : (
            <>
              <TableCard loading={isUpdating} className={visibility.table}>
                {renderTable(data)}
              </TableCard>
              {/* The cards have no common edge, so the progress line runs in the gap between toolbar and grid. */}
              <div className={cn('relative', visibility.cards)}>
                <ProgressBar
                  loading={isUpdating}
                  className="absolute inset-x-0 -top-2.5"
                />
                {renderCards(data, cn(isUpdating && updatingClass))}
              </div>
            </>
          )}

          <ListPagination
            meta={meta}
            itemLabel={itemLabel}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
