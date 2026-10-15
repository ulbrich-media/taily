import type { FilterOption } from '@/components/list/toolbar-filters'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  PERSON_ADOPTION_STATUSES,
  type PersonListSearch,
  type PersonRole,
} from './person-list.search'

export const ROLE_LABELS: Record<PersonRole, string> = {
  inspector: 'Kontrolleur',
  foster: 'Pflegestelle',
  mediator: 'Vermittler',
}

export const NO_ROLE_VALUE = 'none'

export const adoptionStatusOptions: FilterOption<
  (typeof PERSON_ADOPTION_STATUSES)[number]
>[] = [
  { value: 'in_progress', label: 'Vermittlung in Bearbeitung' },
  { value: 'done', label: 'Vermittlung abgeschlossen' },
  { value: 'canceled', label: 'Vermittlung abgebrochen' },
]

export const hasAdoptionsOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Mit Vermittlungen' },
  { value: '0', label: 'Ohne Vermittlungen' },
]

export const hasPreInspectionsOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Mit Vorkontrollen' },
  { value: '0', label: 'Ohne Vorkontrollen' },
]

export const sortOptions: FilterOption<PersonListSearch['sort']>[] = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: 'organization', label: 'Organisation (A–Z)' },
  { value: '-organization', label: 'Organisation (Z–A)' },
  { value: 'city', label: 'Ort (aufsteigend)' },
  { value: '-city', label: 'Ort (absteigend)' },
  { value: '-roles', label: 'Meiste Rollen zuerst' },
  { value: 'roles', label: 'Wenigste Rollen zuerst' },
  { value: '-created_at', label: 'Neueste zuerst' },
  { value: 'created_at', label: 'Älteste zuerst' },
  { value: '-updated_at', label: 'Zuletzt geändert' },
  { value: 'updated_at', label: 'Am längsten unverändert' },
]

/** Options of one role: any animal type, or one specific animal type. */
export function roleOptions(
  role: PersonRole,
  animalTypes: AnimalTypeResource[]
): FilterOption[] {
  return [
    { value: role, label: 'Alle Tierarten' },
    ...animalTypes.map((type) => ({
      value: `${role}:${type.id}`,
      label: type.title,
    })),
  ]
}
