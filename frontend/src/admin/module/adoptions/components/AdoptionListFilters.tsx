import { useState } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PersonListResource } from '@/api/types/people'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import { ListViewToggle } from '@/components/list/ListViewToggle'
import { defineFilter, defineGroup } from '@/components/list/toolbar-filters'
import {
  activePreset,
  adoptionPresets,
  clearFiltersPatch,
  presetPatch,
} from '../adoption-list.presets'
import {
  hasActiveAdoptionFilters,
  resetSearchPatch,
  type AdoptionListSearch,
} from '../adoption-list.search'
import {
  handoverStatusOptions,
  sortOptions,
  statusOptions,
  stepStatusOptions,
} from '../adoption-list.labels'

interface AdoptionListFiltersProps {
  search: AdoptionListSearch
  mediators: PersonListResource[]
  animalTypes: AnimalTypeResource[]
  onChange: (patch: Partial<AdoptionListSearch>) => void
}

export function AdoptionListFilters({
  search,
  mediators,
  animalTypes,
  onChange,
}: AdoptionListFiltersProps) {
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

  const current = activePreset(search)?.key

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    defineFilter({
      // Independent checkbox items that behave like radios: at most one
      // preset matches at a time, and unchecking it clears the filters.
      type: 'multi',
      key: 'preset',
      label: 'Schnellfilter',
      options: adoptionPresets.map((preset) => ({
        value: preset.key,
        label: preset.label,
      })),
      value: current ? [current] : [],
      onChange: (keys) => {
        const picked = keys.find((key) => key !== current)
        const preset = adoptionPresets.find((p) => p.key === picked)
        onChange(preset ? presetPatch(preset) : clearFiltersPatch)
      },
    }),
    // One "Status" dropdown: the overall status plus one section per step.
    defineFilter({
      type: 'sections',
      key: 'status',
      label: 'Status',
      sections: [
        defineGroup({
          key: 'status',
          label: 'Vermittlung',
          options: statusOptions,
          value: search.status,
          onChange: (status) => onChange({ status }),
        }),
        defineGroup({
          key: 'pre_inspection_status',
          label: 'Vorkontrolle',
          options: stepStatusOptions,
          value: search.pre_inspection_status,
          onChange: (pre_inspection_status) =>
            onChange({ pre_inspection_status }),
        }),
        defineGroup({
          key: 'contract_status',
          label: 'Vertrag',
          options: stepStatusOptions,
          value: search.contract_status,
          onChange: (contract_status) => onChange({ contract_status }),
        }),
        defineGroup({
          key: 'transport_status',
          label: 'Transport',
          options: stepStatusOptions,
          value: search.transport_status,
          onChange: (transport_status) => onChange({ transport_status }),
        }),
        defineGroup({
          key: 'handover_status',
          label: 'Übergabe',
          options: handoverStatusOptions,
          value: search.handover_status,
          onChange: (handover_status) => onChange({ handover_status }),
        }),
      ],
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
      key: 'mediator_id',
      label: 'Vermittler',
      allLabel: 'Alle Vermittler',
      options: mediatorOptions,
      value: search.mediator_id,
      onChange: (mediator_id) => onChange({ mediator_id }),
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
      label="Vermittlungen filtern"
      search={
        <SearchInput
          key={searchFieldKey}
          label="Vermittlungen durchsuchen"
          placeholder="Suche nach Name"
          value={search.search}
          onSearch={(value) => onChange({ search: value })}
        />
      }
      filters={filters}
      onReset={() => {
        setSearchFieldKey((key) => key + 1)
        onChange(resetSearchPatch)
      }}
      canReset={hasActiveAdoptionFilters(search)}
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
