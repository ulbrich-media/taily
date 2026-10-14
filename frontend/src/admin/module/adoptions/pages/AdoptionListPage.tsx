import type { ReactNode } from 'react'
import { FilterX, SlashSquare } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { PersonListResource } from '@/api/types/people'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableCard } from '@/components/card/TableCard'
import { ProgressBar } from '@/components/list/ProgressBar'
import { listViewVisibility } from '@/components/list/list-search'
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
import { AdoptionList } from '@/admin/module/adoptions/components/AdoptionList'
import { AdoptionCardGrid } from '@/admin/module/adoptions/components/AdoptionCardGrid'
import { AdoptionListFilters } from '@/admin/module/adoptions/components/AdoptionListFilters'
import {
  hasActiveAdoptionFilters,
  isAdoptionSort,
  resetSearchPatch,
  type AdoptionListSearch,
} from '@/admin/module/adoptions/adoption-list.search'

interface AdoptionListPageProps {
  adoptions: PaginatedResponse<AdoptionListResource>
  search: AdoptionListSearch
  mediators: PersonListResource[]
  animalTypes: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<AdoptionListSearch>) => void
  createAction: ReactNode
  renderDetailLink?: (adoption: AdoptionListResource) => ReactNode
  breadcrumb?: ReactNode
}

export function AdoptionListPage({
  adoptions,
  search,
  mediators,
  animalTypes,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderDetailLink,
  breadcrumb,
}: AdoptionListPageProps) {
  const { data, meta } = adoptions
  const filtered = hasActiveAdoptionFilters(search)
  const { ref: listRef, scrollIfNeeded } =
    useScrollListIntoView<HTMLDivElement>()

  const visibility = listViewVisibility(search.view)

  // The pagination sits below the list: see useScrollListIntoView.
  const handlePageChange = (page: number) => {
    scrollIfNeeded()
    onSearchChange({ page })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vermittlungen"
        description="Verwalte alle Vermittlungsvorgänge"
        actions={createAction}
        breadcrumb={breadcrumb}
      />

      {/* scroll-mt clears the sticky header when scrolled into view */}
      <div ref={listRef} className="scroll-mt-24 space-y-4">
        <AdoptionListFilters
          search={search}
          mediators={mediators}
          animalTypes={animalTypes}
          onChange={onSearchChange}
        />

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
                    <SlashSquare />
                  </EmptyMedia>
                  <EmptyTitle>Keine Vermittlungen gefunden</EmptyTitle>
                  <EmptyDescription>
                    {filtered
                      ? 'Mit den gewählten Filtern gibt es keine Treffer.'
                      : 'Noch keine Vermittlungsvorgänge vorhanden.'}
                  </EmptyDescription>
                </EmptyHeader>
                {filtered && (
                  <EmptyContent>
                    <Button
                      variant="outline"
                      onClick={() => onSearchChange(resetSearchPatch)}
                    >
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
                <AdoptionList
                  adoptions={data}
                  sort={search.sort}
                  onSortChange={(sort) =>
                    isAdoptionSort(sort) && onSearchChange({ sort })
                  }
                  renderDetailLink={renderDetailLink}
                />
              </TableCard>
              {/* The cards have no common edge, so the progress line runs in the gap between toolbar and grid. */}
              <div className={cn('relative', visibility.cards)}>
                <ProgressBar
                  loading={isUpdating}
                  className="absolute inset-x-0 -top-2.5"
                />
                <AdoptionCardGrid
                  adoptions={data}
                  renderDetailLink={renderDetailLink}
                  className={cn(isUpdating && updatingClass)}
                />
              </div>
            </>
          )}

          <ListPagination
            meta={meta}
            itemLabel="Vermittlungen"
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
