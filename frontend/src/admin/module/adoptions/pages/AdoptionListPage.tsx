import type { ReactNode } from 'react'
import { SlashSquare } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { PersonListResource } from '@/api/types/people'
import { ListPage } from '@/components/list/ListPage'
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
  return (
    <ListPage
      title="Vermittlungen"
      description="Verwalte alle Vermittlungsvorgänge"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <AdoptionListFilters
          search={search}
          mediators={mediators}
          animalTypes={animalTypes}
          onChange={onSearchChange}
        />
      }
      list={adoptions}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Vermittlungen"
      empty={{
        icon: SlashSquare,
        title: 'Keine Vermittlungen gefunden',
        descriptionFiltered: 'Mit den gewählten Filtern gibt es keine Treffer.',
        descriptionEmpty: 'Noch keine Vermittlungsvorgänge vorhanden.',
        filtered: hasActiveAdoptionFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(items) => (
        <AdoptionList
          adoptions={items}
          sort={search.sort}
          onSortChange={(sort) =>
            isAdoptionSort(sort) && onSearchChange({ sort })
          }
          renderDetailLink={renderDetailLink}
        />
      )}
      renderCards={(items, className) => (
        <AdoptionCardGrid
          adoptions={items}
          renderDetailLink={renderDetailLink}
          className={className}
        />
      )}
    />
  )
}
