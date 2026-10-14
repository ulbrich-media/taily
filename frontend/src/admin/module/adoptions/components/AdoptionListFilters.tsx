import { LayoutGrid, Table2 } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { PersonListResource } from '@/api/types/people'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shadcn/components/ui/toggle-group'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import type {
  MultiFilterGroup,
  ToolbarFilter,
} from '@/components/list/toolbar-filters'
import {
  activePreset,
  adoptionPresets,
  clearFiltersPatch,
  presetPatch,
} from '../adoption-list.presets'
import {
  ADOPTION_VIEWS,
  hasActiveAdoptionFilters,
  resetSearchPatch,
  type AdoptionListSearch,
  type AdoptionListView,
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

const VIEW_LABELS: Record<AdoptionListView, string> = {
  table: 'Tabelle',
  cards: 'Karten',
}

const VIEW_ICONS = { table: Table2, cards: LayoutGrid }

export function AdoptionListFilters({
  search,
  mediators,
  animalTypes,
  onChange,
}: AdoptionListFiltersProps) {
  const mediatorOptions = [
    { value: 'none', label: 'Nicht zugewiesen' },
    ...mediators.map((mediator) => ({
      value: mediator.id,
      label: mediator.full_name ?? '',
    })),
  ]

  // One "Status" dropdown: the overall status plus one section per step.
  const statusSections: MultiFilterGroup[] = [
    {
      key: 'status',
      label: 'Vermittlung',
      options: statusOptions,
      value: search.status,
      onChange: (status) =>
        onChange({ status: status as AdoptionListSearch['status'] }),
    },
    {
      key: 'pre_inspection_status',
      label: 'Vorkontrolle',
      options: stepStatusOptions,
      value: search.pre_inspection_status,
      onChange: (pre_inspection_status) =>
        onChange({
          pre_inspection_status:
            pre_inspection_status as AdoptionListSearch['pre_inspection_status'],
        }),
    },
    {
      key: 'contract_status',
      label: 'Vertrag',
      options: stepStatusOptions,
      value: search.contract_status,
      onChange: (contract_status) =>
        onChange({
          contract_status:
            contract_status as AdoptionListSearch['contract_status'],
        }),
    },
    {
      key: 'transport_status',
      label: 'Transport',
      options: stepStatusOptions,
      value: search.transport_status,
      onChange: (transport_status) =>
        onChange({
          transport_status:
            transport_status as AdoptionListSearch['transport_status'],
        }),
    },
    {
      key: 'handover_status',
      label: 'Übergabe',
      options: handoverStatusOptions,
      value: search.handover_status,
      onChange: (handover_status) =>
        onChange({
          handover_status:
            handover_status as AdoptionListSearch['handover_status'],
        }),
    },
  ]

  // In priority order: the last filters collapse first on narrow screens.
  const current = activePreset(search)?.key

  const filters: ToolbarFilter[] = [
    {
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
    },
    {
      type: 'sections',
      key: 'status',
      label: 'Status',
      sections: statusSections,
    },
    {
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
    },
    {
      type: 'single',
      key: 'mediator_id',
      label: 'Vermittler',
      allLabel: 'Alle Vermittler',
      options: mediatorOptions,
      value: search.mediator_id,
      onChange: (mediator_id) => onChange({ mediator_id }),
    },
  ]

  const sort: ToolbarFilter = {
    type: 'single',
    key: 'sort',
    label: 'Sortierung',
    options: sortOptions,
    value: search.sort,
    onChange: (value) =>
      value && onChange({ sort: value as AdoptionListSearch['sort'] }),
    highlightActive: false,
  }

  return (
    <ListToolbar
      label="Vermittlungen filtern"
      search={
        <SearchInput
          label="Vermittlungen durchsuchen"
          placeholder="Suche nach Name"
          value={search.search}
          onSearch={(value) => onChange({ search: value })}
        />
      }
      filters={filters}
      onReset={() => onChange(resetSearchPatch(search))}
      canReset={hasActiveAdoptionFilters(search)}
      trailing={
        <>
          <FilterDropdown filter={sort} />
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Ansicht"
            value={search.view}
            onValueChange={(view) => {
              // A single toggle group reports '' when the active item is clicked again.
              if (!view) return
              // Presentation only, so the page stays.
              onChange({ view: view as AdoptionListView, page: search.page })
            }}
            className="hidden lg:flex"
          >
            {ADOPTION_VIEWS.map((view) => {
              const Icon = VIEW_ICONS[view]
              return (
                <ToggleGroupItem key={view} value={view}>
                  <Icon className="size-4" />
                  <span className="sr-only">{VIEW_LABELS[view]}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </>
      }
    />
  )
}
