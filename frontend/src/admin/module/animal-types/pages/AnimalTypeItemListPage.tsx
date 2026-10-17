import type { ComponentType, ReactNode } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PaginatedResponse } from '@/api/types/pagination'
import { ListPage } from '@/components/list/ListPage'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import { defineFilter } from '@/components/list/toolbar-filters'
import {
  AnimalTypeItemCardGrid,
  AnimalTypeItemList,
  type AnimalTypeItem,
} from '@/admin/module/animal-types/components/AnimalTypeItemList'
import {
  hasActiveAnimalTypeItemFilters,
  resetSearchPatch,
  type AnimalTypeItemListSearch,
} from '@/admin/module/animal-types/animal-type-item-list.search'

interface AnimalTypeItemListPageProps<T extends AnimalTypeItem> {
  title: string
  description: string
  /** Plural noun for the pagination, e.g. "Impfungen". */
  itemLabel: string
  icon: ComponentType
  emptyTitle: string
  emptyDescription: string
  items: PaginatedResponse<T>
  search: AnimalTypeItemListSearch
  animalTypes: AnimalTypeResource[]
  /** True while the previous result is shown and the next one is loading. */
  isUpdating?: boolean
  onSearchChange: (patch: Partial<AnimalTypeItemListSearch>) => void
  createAction?: ReactNode
  renderRowActions?: (item: T) => ReactNode
  breadcrumb?: ReactNode
}

/** The vaccination and medical test lists: one merged list with the animal type as column and filter. */
export function AnimalTypeItemListPage<T extends AnimalTypeItem>({
  title,
  description,
  itemLabel,
  icon,
  emptyTitle,
  emptyDescription,
  items,
  search,
  animalTypes,
  isUpdating = false,
  onSearchChange,
  createAction,
  renderRowActions,
  breadcrumb,
}: AnimalTypeItemListPageProps<T>) {
  const filters = [
    defineFilter({
      type: 'single',
      key: 'animal_type_id',
      label: 'Tierart',
      allLabel: 'Alle Tierarten',
      options: animalTypes.map((type) => ({
        value: type.id,
        label: type.title,
      })),
      value: search.animal_type_id,
      onChange: (animal_type_id) => onSearchChange({ animal_type_id }),
    }),
  ]

  return (
    <ListPage
      title={title}
      description={description}
      breadcrumb={breadcrumb}
      createAction={createAction}
      toolbar={
        <ListFiltersToolbar
          search={search}
          onChange={onSearchChange}
          resetPatch={resetSearchPatch}
          canReset={hasActiveAnimalTypeItemFilters(search)}
          filters={filters}
          label={`${itemLabel} filtern`}
        />
      }
      list={items}
      view={search.view}
      isUpdating={isUpdating}
      onPageChange={(page) => onSearchChange({ page })}
      itemLabel={itemLabel}
      empty={{
        icon,
        title: emptyTitle,
        descriptionFiltered: 'Mit den gewählten Filtern gibt es keine Treffer.',
        descriptionEmpty: emptyDescription,
        filtered: hasActiveAnimalTypeItemFilters(search),
        onReset: () => onSearchChange(resetSearchPatch),
      }}
      renderTable={(rows) => (
        <AnimalTypeItemList items={rows} renderRowActions={renderRowActions} />
      )}
      renderCards={(rows, className) => (
        <AnimalTypeItemCardGrid
          items={rows}
          renderRowActions={renderRowActions}
          className={className}
        />
      )}
    />
  )
}
