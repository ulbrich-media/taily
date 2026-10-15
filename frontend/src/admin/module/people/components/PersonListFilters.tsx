import { useState } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { OrganizationResource } from '@/api/types/organizations'
import { SearchInput } from '@/components/list/SearchInput'
import { FilterDropdown } from '@/components/list/FilterDropdown'
import { ListToolbar } from '@/components/list/ListToolbar'
import { ListViewToggle } from '@/components/list/ListViewToggle'
import {
  defineFilter,
  defineGroup,
  type FilterOption,
} from '@/components/list/toolbar-filters'
import {
  activePreset,
  clearFiltersPatch,
  personPresets,
  presetPatch,
} from '../person-list.presets'
import {
  PERSON_ROLES,
  hasActivePersonFilters,
  resetSearchPatch,
  type PersonListSearch,
  type PersonRole,
} from '../person-list.search'
import {
  NO_ROLE_VALUE,
  ROLE_LABELS,
  adoptionStatusOptions,
  hasAdoptionsOptions,
  hasPreInspectionsOptions,
  roleOptions,
  sortOptions,
} from '../person-list.labels'

interface PersonListFiltersProps {
  search: PersonListSearch
  organizations: OrganizationResource[]
  animalTypes: AnimalTypeResource[]
  onChange: (patch: Partial<PersonListSearch>) => void
}

type YesNoKey = 'has_adoptions' | 'has_pre_inspections'

/** Whether a role filter value belongs to the section of `role` (`mediator` or `mediator:<id>`). */
const inSection = (value: string, role: PersonRole) =>
  value === role || value.startsWith(`${role}:`)

export function PersonListFilters({
  search,
  organizations,
  animalTypes,
  onChange,
}: PersonListFiltersProps) {
  // Remounts the search field on reset, so a term that was typed but never
  // submitted is dropped as well.
  const [searchFieldKey, setSearchFieldKey] = useState(0)

  const organizationOptions = [
    { value: 'none', label: 'Ohne Organisation', general: true },
    ...organizations.map((organization) => ({
      value: organization.id,
      label: organization.name,
    })),
  ]

  const current = activePreset(search)?.key

  // One checkbox section per role. The role filter is a single list in the
  // URL, so a section replaces only its own values and keeps the others.
  const roleSection = (
    key: string,
    label: string | undefined,
    options: FilterOption[],
    belongs: (value: string) => boolean
  ) =>
    defineGroup({
      key,
      label,
      options,
      value: search.role.filter(belongs),
      onChange: (values) =>
        onChange({
          role: [...search.role.filter((v) => !belongs(v)), ...values],
        }),
    })

  // A yes/no filter in a checkbox section: at most one of the two is set,
  // checking the other one switches, unchecking clears.
  const yesNoGroup = (key: YesNoKey, options: FilterOption<'1' | '0'>[]) =>
    defineGroup({
      key,
      options,
      value: search[key] ? [search[key]] : [],
      onChange: (values) =>
        onChange({ [key]: values.find((v) => v !== search[key]) }),
    })

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    defineFilter({
      // Independent checkbox items that behave like radios: at most one
      // preset matches at a time, and unchecking it clears the filters.
      type: 'multi',
      key: 'preset',
      label: 'Schnellfilter',
      options: personPresets.map((preset) => ({
        value: preset.key,
        label: preset.label,
      })),
      value: current ? [current] : [],
      onChange: (selected) => {
        const picked = selected.find((key) => key !== current)
        const preset = personPresets.find((p) => p.key === picked)
        onChange(preset ? presetPatch(preset) : clearFiltersPatch)
      },
    }),
    defineFilter({
      type: 'sections',
      key: 'role',
      label: 'Rolle',
      sections: [
        roleSection(
          NO_ROLE_VALUE,
          undefined,
          [{ value: NO_ROLE_VALUE, label: 'Keine Rolle' }],
          (value) => value === NO_ROLE_VALUE
        ),
        ...PERSON_ROLES.map((role) =>
          roleSection(
            role,
            ROLE_LABELS[role],
            roleOptions(role, animalTypes),
            (value) => inSection(value, role)
          )
        ),
      ],
    }),
    defineFilter({
      type: 'single',
      key: 'organization_id',
      label: 'Organisation',
      allLabel: 'Alle Organisationen',
      options: organizationOptions,
      value: search.organization_id,
      onChange: (organization_id) => onChange({ organization_id }),
    }),
    defineFilter({
      type: 'sections',
      key: 'more',
      label: 'Status',
      sections: [
        yesNoGroup('has_adoptions', hasAdoptionsOptions),
        yesNoGroup('has_pre_inspections', hasPreInspectionsOptions),
        defineGroup({
          key: 'adoption_status',
          options: adoptionStatusOptions,
          value: search.adoption_status,
          onChange: (adoption_status) => onChange({ adoption_status }),
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
      label="Personen filtern"
      search={
        <SearchInput
          key={searchFieldKey}
          label="Personen durchsuchen"
          placeholder="Suche nach Name, E-Mail, Ort …"
          value={search.search}
          onSearch={(value) => onChange({ search: value })}
        />
      }
      filters={filters}
      onReset={() => {
        setSearchFieldKey((key) => key + 1)
        onChange(resetSearchPatch)
      }}
      canReset={hasActivePersonFilters(search)}
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
