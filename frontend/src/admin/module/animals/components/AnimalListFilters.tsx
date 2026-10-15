import { useState } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PersonListResource } from '@/api/types/people'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import { ListViewToggle } from '@/components/list/ListViewToggle'
import { defineFilter, defineGroup } from '@/components/list/toolbar-filters'
import {
  hasActiveAnimalFilters,
  resetSearchPatch,
  type AnimalListSearch,
} from '../animal-list.search'
import { sortOptions, statusOptions, yesNoOptions } from '../animal-list.labels'

interface AnimalListFiltersProps {
  search: AnimalListSearch
  mediators: PersonListResource[]
  animalTypes: AnimalTypeResource[]
  onChange: (patch: Partial<AnimalListSearch>) => void
}

type YesNoKey = 'published' | 'neutered' | 'has_image'
type FlagKey = 'boarding' | 'reserved' | 'has_sponsor'

const FLAG_OPTIONS: { value: FlagKey; label: string }[] = [
  { value: 'boarding', label: 'Nur Pensionstiere' },
  { value: 'reserved', label: 'Nur reservierte' },
  { value: 'has_sponsor', label: 'Nur mit Pate' },
]

export function AnimalListFilters({
  search,
  mediators,
  animalTypes,
  onChange,
}: AnimalListFiltersProps) {
  // Remounts the search field on reset, so a term that was typed but never
  // submitted is dropped as well.
  const [searchFieldKey, setSearchFieldKey] = useState(0)

  const mediatorOptions = [
    { value: 'none', label: 'Nicht zugewiesen' },
    ...mediators.map((mediator) => ({
      value: mediator.id,
      label: mediator.full_name ?? '',
    })),
  ]

  // A yes/no filter in a checkbox section: at most one of the two is set,
  // checking the other one switches, unchecking clears.
  const yesNoGroup = (key: YesNoKey, label: string) =>
    defineGroup({
      key,
      label,
      options: yesNoOptions,
      value: search[key] ? [search[key]] : [],
      onChange: (values) =>
        onChange({ [key]: values.find((v) => v !== search[key]) }),
    })

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    defineFilter({
      type: 'multi',
      key: 'status',
      label: 'Status',
      options: statusOptions,
      value: search.status,
      onChange: (status) => onChange({ status }),
    }),
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
      onChange: (animal_type_id) => onChange({ animal_type_id }),
    }),
    defineFilter({
      type: 'single',
      key: 'assigned_agent_id',
      label: 'Zuständig',
      allLabel: 'Alle Zuständigen',
      options: mediatorOptions,
      value: search.assigned_agent_id,
      onChange: (assigned_agent_id) => onChange({ assigned_agent_id }),
    }),
    defineFilter({
      type: 'sections',
      key: 'more',
      label: 'Weitere Filter',
      sections: [
        yesNoGroup('published', 'Veröffentlicht'),
        yesNoGroup('neutered', 'Kastriert'),
        yesNoGroup('has_image', 'Mit Bild'),
        defineGroup({
          key: 'flags',
          label: 'Nur anzeigen',
          options: FLAG_OPTIONS,
          value: FLAG_OPTIONS.filter((o) => search[o.value]).map(
            (o) => o.value
          ),
          onChange: (selected) =>
            onChange({
              boarding: selected.includes('boarding') ? '1' : undefined,
              reserved: selected.includes('reserved') ? '1' : undefined,
              has_sponsor: selected.includes('has_sponsor') ? '1' : undefined,
            }),
        }),
      ],
    }),
  ]

  const sort = defineFilter({
    type: 'single',
    key: 'sort',
    label: 'Sortierung',
    options: sortOptions,
    value: search.sort,
    onChange: (value) => value && onChange({ sort: value }),
    highlightActive: false,
  })

  return (
    <ListToolbar
      label="Tiere filtern"
      search={
        <SearchInput
          key={searchFieldKey}
          label="Tiere durchsuchen"
          placeholder="Suche nach Name, Nummer, Chip …"
          value={search.search}
          onSearch={(value) => onChange({ search: value })}
        />
      }
      filters={filters}
      onReset={() => {
        setSearchFieldKey((key) => key + 1)
        onChange(resetSearchPatch)
      }}
      canReset={hasActiveAnimalFilters(search)}
      trailing={
        <>
          <FilterDropdown filter={sort} />
          <ListViewToggle
            value={search.view}
            // Presentation only, so the page stays.
            onChange={(view) => onChange({ view, page: search.page })}
          />
        </>
      }
    />
  )
}
