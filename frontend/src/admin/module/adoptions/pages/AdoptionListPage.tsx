import type { ReactNode } from 'react'
import { FilterX, SlashSquare } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { PersonListResource } from '@/api/types/people'
import { PageHeader } from '@/components/layout/PageHeader'
import { CardTable } from '@/components/card/CardTable'
import { ListPagination } from '@/components/list/ListPagination'
import { Card, CardContent } from '@/shadcn/components/ui/card'
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

  // Cards are always used on small screens; the table is `lg` and up only.
  const tableVisibility = search.view === 'table' ? 'hidden lg:block' : 'hidden'
  const cardsVisibility = search.view === 'table' ? 'lg:hidden' : ''

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vermittlungen"
        description="Verwalte alle Vermittlungsvorgänge"
        actions={createAction}
        breadcrumb={breadcrumb}
      />

      <div className="space-y-4">
        <AdoptionListFilters
          search={search}
          mediators={mediators}
          animalTypes={animalTypes}
          onChange={onSearchChange}
        />

        <div
          className={cn(
            'space-y-4 transition-opacity',
            isUpdating && 'opacity-60'
          )}
          aria-busy={isUpdating}
        >
          {data.length === 0 ? (
            <Empty>
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
                    onClick={() => onSearchChange(resetSearchPatch(search))}
                  >
                    <FilterX />
                    Filter zurücksetzen
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <>
              <Card className={cn('py-0', tableVisibility)}>
                <CardContent>
                  <CardTable>
                    <AdoptionList
                      adoptions={data}
                      sort={search.sort}
                      onSortChange={(sort) =>
                        onSearchChange({
                          sort: sort as AdoptionListSearch['sort'],
                        })
                      }
                      renderDetailLink={renderDetailLink}
                    />
                  </CardTable>
                </CardContent>
              </Card>
              <AdoptionCardGrid
                adoptions={data}
                renderDetailLink={renderDetailLink}
                className={cardsVisibility}
              />
            </>
          )}

          <ListPagination
            meta={meta}
            itemLabel="Vermittlungen"
            onPageChange={(page) => onSearchChange({ page })}
          />
        </div>
      </div>
    </div>
  )
}
