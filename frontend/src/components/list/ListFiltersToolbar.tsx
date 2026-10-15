import { useState } from 'react'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import { ListViewToggle } from '@/components/list/ListViewToggle'
import type { BaseListSearch } from '@/components/list/list-query'
import {
  defineFilter,
  type FilterOption,
  type ToolbarFilter,
} from '@/components/list/toolbar-filters'

interface ListFiltersToolbarProps<S extends BaseListSearch> {
  search: S
  onChange: (patch: Partial<S>) => void
  /** Patch that clears the search term and every filter. */
  resetPatch: Partial<S>
  canReset: boolean
  /** The list's filters, in priority order: the last ones collapse first. */
  filters: ToolbarFilter[]
  sortOptions: FilterOption[]
  /** Accessible label of the toolbar, e.g. "Tiere filtern". */
  label: string
  searchLabel: string
  searchPlaceholder: string
}

/** Toolbar shared by the filterable lists: search, filters, sort and view toggle. */
export function ListFiltersToolbar<S extends BaseListSearch>({
  search,
  onChange,
  resetPatch,
  canReset,
  filters,
  sortOptions,
  label,
  searchLabel,
  searchPlaceholder,
}: ListFiltersToolbarProps<S>) {
  // Remounts the search field on reset, so a term that was typed but never
  // submitted is dropped as well.
  const [searchFieldKey, setSearchFieldKey] = useState(0)

  const sort = defineFilter({
    type: 'single',
    key: 'sort',
    label: 'Sortierung',
    options: sortOptions,
    value: search.sort,
    onChange: (value) => value && onChange({ sort: value } as Partial<S>),
    highlightActive: false,
  })

  return (
    <ListToolbar
      label={label}
      search={
        <SearchInput
          key={searchFieldKey}
          label={searchLabel}
          placeholder={searchPlaceholder}
          value={search.search}
          onSearch={(value) => onChange({ search: value } as Partial<S>)}
        />
      }
      filters={filters}
      onReset={() => {
        setSearchFieldKey((key) => key + 1)
        onChange(resetPatch)
      }}
      canReset={canReset}
      trailing={
        <>
          <FilterDropdown filter={sort} />
          <ListViewToggle
            value={search.view}
            // Presentation only, so the page stays.
            onChange={(view) =>
              onChange({ view, page: search.page } as Partial<S>)
            }
          />
        </>
      }
    />
  )
}
