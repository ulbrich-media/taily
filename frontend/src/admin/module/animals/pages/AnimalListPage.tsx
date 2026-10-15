import type { ReactNode } from 'react'
import { FilterX, PawPrint } from 'lucide-react'
import type { AnimalListResource } from '@/api/types/animals'
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
import { AnimalList } from '@/admin/module/animals/components/AnimalList'
import { AnimalCardGrid } from '@/admin/module/animals/components/AnimalCardGrid'
import { AnimalListFilters } from '@/admin/module/animals/components/AnimalListFilters'
import {
  hasActiveAnimalFilters,
  isAnimalSort,
  resetSearchPatch,
  type AnimalListSearch,
} from '@/admin/module/animals/animal-list.search'

interface AnimalListPageProps {
  animals: PaginatedResponse<AnimalListResource>
  search: AnimalListSearch
  mediators: PersonListResource[]
  animalTypes: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<AnimalListSearch>) => void
  createAction: ReactNode
  renderRowActions: (animal: AnimalListResource) => ReactNode
  breadcrumb?: ReactNode
}

export function AnimalListPage({
  animals,
  search,
  mediators,
  animalTypes,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: AnimalListPageProps) {
  const { data, meta } = animals
  const filtered = hasActiveAnimalFilters(search)
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
        title="Tiere"
        description="Verwalte alle Tiere im System"
        actions={createAction}
        breadcrumb={breadcrumb}
      />

      {/* scroll-mt clears the sticky header when scrolled into view */}
      <div ref={listRef} className="scroll-mt-24 space-y-4">
        <AnimalListFilters
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
                    <PawPrint />
                  </EmptyMedia>
                  <EmptyTitle>Keine Tiere gefunden</EmptyTitle>
                  <EmptyDescription>
                    {filtered
                      ? 'Mit den gewählten Filtern gibt es keine Treffer.'
                      : 'Füge jetzt ein Tier hinzu!'}
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
                <AnimalList
                  animals={data}
                  sort={search.sort}
                  onSortChange={(sort) =>
                    isAnimalSort(sort) && onSearchChange({ sort })
                  }
                  renderRowActions={renderRowActions}
                />
              </TableCard>
              {/* The cards have no common edge, so the progress line runs in the gap between toolbar and grid. */}
              <div className={cn('relative', visibility.cards)}>
                <ProgressBar
                  loading={isUpdating}
                  className="absolute inset-x-0 -top-2.5"
                />
                <AnimalCardGrid
                  animals={data}
                  renderRowActions={renderRowActions}
                  className={cn(isUpdating && updatingClass)}
                />
              </div>
            </>
          )}

          <ListPagination
            meta={meta}
            itemLabel="Tiere"
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
