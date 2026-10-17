import { useState } from 'react'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import { ListViewToggle } from '@/components/list/ListViewToggle'
import { useListViewControl } from '@/components/list/list-view'
import type { BaseListSearch } from '@/components/list/list-query'
import {
  defineFilter,
  type FilterOption,
  type ToolbarFilter,
} from '@/components/list/toolbar-filters'

interface ListFiltersToolbarProps<S extends BaseListSearch> {
  search: S
  onChange: (patch: Partial<S>) => void
  /** Patch that clears the search term and every filter. Omit for lists without any. */
  resetPatch?: Partial<S>
  canReset?: boolean
  /** The list's filters, in priority order: the last ones collapse first. */
  filters?: ToolbarFilter[]
  /** Omit for lists with a fixed order: there is no sort dropdown then. */
  sortOptions?: FilterOption[]
  /** Accessible label of the toolbar, e.g. "Tiere filtern". */
  label: string
  /** Omit both for lists that cannot be searched. */
  searchLabel?: string
  searchPlaceholder?: string
}

/** Toolbar shared by the filterable lists: search, filters, sort and view toggle. */
export function ListFiltersToolbar<S extends BaseListSearch>({
  search,
  onChange,
  resetPatch,
  canReset = false,
  filters = [],
  sortOptions,
  label,
  searchLabel,
  searchPlaceholder,
}: ListFiltersToolbarProps<S>) {
  // Remounts the search field on reset, so a term that was typed but never
  // submitted is dropped as well.
  const [searchFieldKey, setSearchFieldKey] = useState(0)
  const { view, setView } = useListViewControl()

  const sort = sortOptions
    ? defineFilter({
        type: 'single',
        key: 'sort',
        label: 'Sortierung',
        options: sortOptions,
        value: search.sort,
        onChange: (value) => value && onChange({ sort: value } as Partial<S>),
        highlightActive: false,
      })
    : undefined

  return (
    <ListToolbar
      label={label}
      search={
        searchLabel && (
          <SearchInput
            key={searchFieldKey}
            label={searchLabel}
            placeholder={searchPlaceholder ?? ''}
            value={search.search}
            onSearch={(value) => onChange({ search: value } as Partial<S>)}
          />
        )
      }
      filters={filters}
      onReset={
        resetPatch
          ? () => {
              setSearchFieldKey((key) => key + 1)
              onChange(resetPatch)
            }
          : undefined
      }
      canReset={canReset}
      trailing={
        <>
          {sort && <FilterDropdown filter={sort} />}
          <ListViewToggle value={view} onChange={setView} />
        </>
      }
    />
  )
}
