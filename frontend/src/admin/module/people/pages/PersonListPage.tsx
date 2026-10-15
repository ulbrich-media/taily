import type { ReactNode } from 'react'
import { User } from 'lucide-react'
import type { PersonListResource } from '@/api/types/people'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { OrganizationResource } from '@/api/types/organizations'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
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
  return (
    <ListPage
      title="Personen"
      description="Verwalte alle Personen und Kontakte"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <PersonListFilters
          search={search}
          organizations={organizations}
          animalTypes={animalTypes}
          onChange={onSearchChange}
        />
      }
      list={people}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Personen"
      empty={{
        icon: User,
        title: 'Keine Personen gefunden',
        descriptionFiltered: 'Mit den gewählten Filtern gibt es keine Treffer.',
        descriptionEmpty: 'Füge jetzt eine Person hinzu!',
        filtered: hasActivePersonFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(items) => (
        <PersonList
          people={items}
          sort={search.sort}
          onSortChange={(sort) =>
            isPersonSort(sort) && onSearchChange({ sort })
          }
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <PersonCardGrid
          people={items}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
