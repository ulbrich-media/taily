import { useMemo } from 'react'
import { useAuth } from '@/lib/auth.hook'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PersonListResource } from '@/api/types/people'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import {
  defineFilter,
  defineGroup,
  presetFilter,
} from '@/components/list/toolbar-filters'
import {
  activePreset,
  clearFiltersPatch,
  getAdoptionPresets,
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
  const mediatorOptions = [
    { value: 'none', label: 'Nicht zugewiesen', general: true },
    ...mediators.map((mediator) => ({
      value: mediator.id,
      label: mediator.full_name ?? '',
    })),
  ]

  const { user } = useAuth()
  const personId = user?.person_id ?? null
  const presets = useMemo(() => getAdoptionPresets(personId), [personId])
  const current = activePreset(search, presets)?.key

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    presetFilter({
      presets,
      current,
      onPick: (preset) => onChange(presetPatch(preset)),
      onClear: () => onChange(clearFiltersPatch),
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

  return (
    <ListFiltersToolbar
      search={search}
      onChange={onChange}
      resetPatch={resetSearchPatch}
      canReset={hasActiveAdoptionFilters(search)}
      filters={filters}
      sortOptions={sortOptions}
      label="Vermittlungen filtern"
      searchLabel="Vermittlungen durchsuchen"
      searchPlaceholder="Suche nach Name"
    />
  )
}
