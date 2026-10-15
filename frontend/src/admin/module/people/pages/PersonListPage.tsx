import type { ReactNode } from 'react'
import { FilterX, User } from 'lucide-react'
import type { PersonListResource } from '@/api/types/people'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { OrganizationResource } from '@/api/types/organizations'
import type { PaginatedResponse } from '@/api/types/pagination'
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
import { PersonList } from '@/admin/module/people/components/PersonList'
import { PersonCardGrid } from '@/admin/module/people/components/PersonCardGrid'
import { PersonListFilters } from '@/admin/module/people/components/PersonListFilters'
import {
  hasActivePersonFilters,
  isPersonSort,
  resetSearchPatch,
  type PersonListSearch,
} from '@/admin/module/people/person-list.search'

interface PersonListPageProps {
  people: PaginatedResponse<PersonListResource>
  search: PersonListSearch
  organizations: OrganizationResource[]
  animalTypes: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<PersonListSearch>) => void
  createAction: ReactNode
  renderRowActions: (person: PersonListResource) => ReactNode
  breadcrumb?: ReactNode
}

export function PersonListPage({
  people,
  search,
  organizations,
  animalTypes,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: PersonListPageProps) {
  const { data, meta } = people
  const filtered = hasActivePersonFilters(search)
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
        title="Personen"
        description="Verwalte alle Personen und Kontakte"
        actions={createAction}
        breadcrumb={breadcrumb}
      />

      {/* scroll-mt clears the sticky header when scrolled into view */}
      <div ref={listRef} className="scroll-mt-24 space-y-4">
        <PersonListFilters
          search={search}
          organizations={organizations}
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
                    <User />
                  </EmptyMedia>
                  <EmptyTitle>Keine Personen gefunden</EmptyTitle>
                  <EmptyDescription>
                    {filtered
                      ? 'Mit den gewählten Filtern gibt es keine Treffer.'
                      : 'Füge jetzt eine Person hinzu!'}
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
                <PersonList
                  people={data}
                  sort={search.sort}
                  onSortChange={(sort) =>
                    isPersonSort(sort) && onSearchChange({ sort })
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
                <PersonCardGrid
                  people={data}
                  renderRowActions={renderRowActions}
                  className={cn(isUpdating && updatingClass)}
                />
              </div>
            </>
          )}

          <ListPagination
            meta={meta}
            itemLabel="Personen"
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
