import { useMemo } from 'react'
import { useAuth } from '@/lib/auth.hook'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PersonListResource } from '@/api/types/people'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import {
  defineFilter,
  defineGroup,
  presetFilter,
  yesNoGroup,
} from '@/components/list/toolbar-filters'
import {
  activePreset,
  clearFiltersPatch,
  getAnimalPresets,
  presetPatch,
} from '../animal-list.presets'
import {
  hasActiveAnimalFilters,
  resetSearchPatch,
  type AnimalListSearch,
} from '../animal-list.search'
import {
  hasImageOptions,
  neuteredOptions,
  publishedOptions,
  sortOptions,
  statusOptions,
} from '../animal-list.labels'

interface AnimalListFiltersProps {
  search: AnimalListSearch
  mediators: PersonListResource[]
  animalTypes: AnimalTypeResource[]
  onChange: (patch: Partial<AnimalListSearch>) => void
}

type FlagKey = 'boarding' | 'reserved' | 'has_sponsor'

const FLAG_OPTIONS: { value: FlagKey; label: string }[] = [
  { value: 'boarding', label: 'Nur Pensionstiere' },
  { value: 'reserved', label: 'Nur reservierte' },
  { value: 'has_sponsor', label: 'Nur mit Patenschaft' },
]

export function AnimalListFilters({
  search,
  mediators,
  animalTypes,
  onChange,
}: AnimalListFiltersProps) {
  const mediatorOptions = [
    { value: 'none', label: 'Nicht zugewiesen', general: true },
    ...mediators.map((mediator) => ({
      value: mediator.id,
      label: mediator.full_name ?? '',
    })),
  ]

  const { user } = useAuth()
  const personId = user?.person_id ?? null
  const presets = useMemo(() => getAnimalPresets(personId), [personId])
  const current = activePreset(search, presets)?.key

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    // Only offered when there is a preset for this user.
    ...(presets.length > 0
      ? [
          presetFilter({
            presets,
            current,
            onPick: (preset) => onChange(presetPatch(preset)),
            onClear: () => onChange(clearFiltersPatch),
          }),
        ]
      : []),
    defineFilter({
      type: 'multi',
      key: 'status',
      label: 'Vermittlung',
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
      label: 'Status',
      sections: [
        yesNoGroup('published', publishedOptions, search.published, onChange),
        yesNoGroup('neutered', neuteredOptions, search.neutered, onChange),
        yesNoGroup('has_image', hasImageOptions, search.has_image, onChange),
        defineGroup({
          key: 'flags',
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

  return (
    <ListFiltersToolbar
      search={search}
      onChange={onChange}
      resetPatch={resetSearchPatch}
      canReset={hasActiveAnimalFilters(search)}
      filters={filters}
      sortOptions={sortOptions}
      label="Tiere filtern"
      searchLabel="Tiere durchsuchen"
      searchPlaceholder="Suche nach Name, Nummer, Chip …"
    />
  )
}
