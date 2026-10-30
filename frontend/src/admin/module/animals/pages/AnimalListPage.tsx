import type { ReactNode } from 'react'
import { PawPrint } from 'lucide-react'
import type { AnimalListResource } from '@/api/types/animals'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import type { PersonListResource } from '@/api/types/people'
import { ListPage } from '@/components/list/ListPage'
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
  return (
    <ListPage
      title="Tiere"
      description="Verwalte alle Tiere im System"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <AnimalListFilters
          search={search}
          mediators={mediators}
          animalTypes={animalTypes}
          onChange={onSearchChange}
        />
      }
      list={animals}
      viewKey="animals"
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Tiere"
      empty={{
        icon: PawPrint,
        title: 'Keine Tiere gefunden',
        descriptionFiltered: 'Mit den gewählten Filtern gibt es keine Treffer.',
        descriptionEmpty: 'Füge jetzt ein Tier hinzu!',
        filtered: hasActiveAnimalFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(items) => (
        <AnimalList
          animals={items}
          sort={search.sort}
          onSortChange={(sort) =>
            isAnimalSort(sort) && onSearchChange({ sort })
          }
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <AnimalCardGrid
          animals={items}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
