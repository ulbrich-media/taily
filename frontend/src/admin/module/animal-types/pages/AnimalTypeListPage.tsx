import type { ReactNode } from 'react'
import { SlashSquareIcon } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import type { PlainListSearch } from '@/components/list/plain-list-search'
import {
  AnimalTypeCardGrid,
  AnimalTypeList,
} from '@/admin/module/animal-types/components/AnimalTypeList'

interface AnimalTypeListPageProps {
  animalTypes: PaginatedResponse<AnimalTypeResource>
  search: PlainListSearch
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<PlainListSearch>) => void
  createAction?: ReactNode
  renderRowActions?: (animalType: AnimalTypeResource) => ReactNode
  breadcrumb?: ReactNode
}

export function AnimalTypeListPage({
  animalTypes,
  search,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: AnimalTypeListPageProps) {
  return (
    <ListPage
      title="Tierarten"
      description="Verwalte die verfügbaren Tierarten und weise Formularvorlagen zu"
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <ListFiltersToolbar
          search={search}
          onChange={onSearchChange}
          label="Tierarten"
        />
      }
      list={animalTypes}
      viewKey="animal-types"
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel="Tierarten"
      empty={{
        icon: SlashSquareIcon,
        title: 'Keine Tierarten vorhanden',
        descriptionFiltered: '',
        descriptionEmpty: createAction
          ? 'Erstelle die erste Tierart!'
          : 'Es sind noch keine Tierarten vorhanden.',
        filtered: false,
        onReset: () => undefined,
      }}
      renderTable={(items) => (
        <AnimalTypeList
          animalTypes={items}
          renderRowActions={renderRowActions}
        />
      )}
      renderCards={(items, className) => (
        <AnimalTypeCardGrid
          animalTypes={items}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
