import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { OrganizationResource } from '@/api/types/organizations'
import { ListFiltersToolbar } from '@/components/list/ListFiltersToolbar'
import {
  defineFilter,
  defineGroup,
  presetFilter,
  yesNoGroup,
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

/** Whether a role filter value belongs to the section of `role` (`mediator` or `mediator:<id>`). */
const inSection = (value: string, role: PersonRole) =>
  value === role || value.startsWith(`${role}:`)

export function PersonListFilters({
  search,
  organizations,
  animalTypes,
  onChange,
}: PersonListFiltersProps) {
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

  // In priority order: the last filters collapse first on narrow screens.
  const filters = [
    presetFilter({
      presets: personPresets,
      current,
      onPick: (preset) => onChange(presetPatch(preset)),
      onClear: () => onChange(clearFiltersPatch),
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
        yesNoGroup(
          'has_adoptions',
          hasAdoptionsOptions,
          search.has_adoptions,
          onChange
        ),
        yesNoGroup(
          'has_pre_inspections',
          hasPreInspectionsOptions,
          search.has_pre_inspections,
          onChange
        ),
        defineGroup({
          key: 'adoption_status',
          options: adoptionStatusOptions,
          value: search.adoption_status,
          onChange: (adoption_status) => onChange({ adoption_status }),
        }),
      ],
    }),
  ]

  return (
    <ListFiltersToolbar
      search={search}
      onChange={onChange}
      resetPatch={resetSearchPatch}
      canReset={hasActivePersonFilters(search)}
      filters={filters}
      sortOptions={sortOptions}
      label="Personen filtern"
      searchLabel="Personen durchsuchen"
      searchPlaceholder="Suche nach Name, E-Mail, Ort …"
    />
  )
}
