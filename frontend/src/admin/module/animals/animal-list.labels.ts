import type { FilterOption } from '@/components/list/toolbar-filters'
import { ANIMAL_STATUSES, type AnimalListSearch } from './animal-list.search'

export const ANIMAL_STATUS_LABELS: Record<
  (typeof ANIMAL_STATUSES)[number],
  string
> = {
  open: 'Offen',
  in_progress: 'In Vermittlung',
  adopted: 'Vermittelt',
}

export const statusOptions: FilterOption<(typeof ANIMAL_STATUSES)[number]>[] =
  ANIMAL_STATUSES.map((value) => ({
    value,
    label: ANIMAL_STATUS_LABELS[value],
  }))

export const sortOptions: FilterOption<AnimalListSearch['sort']>[] = [
  { value: '-created_at', label: 'Neueste zuerst' },
  { value: 'created_at', label: 'Älteste zuerst' },
  { value: '-updated_at', label: 'Zuletzt geändert' },
  { value: 'updated_at', label: 'Am längsten unverändert' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: '-name', label: 'Name (Z–A)' },
  { value: 'breed', label: 'Rasse (A–Z)' },
  { value: '-breed', label: 'Rasse (Z–A)' },
  { value: 'color', label: 'Farbe (A–Z)' },
  { value: '-color', label: 'Farbe (Z–A)' },
  { value: '-date_of_birth', label: 'Alter (jüngste zuerst)' },
  { value: 'date_of_birth', label: 'Alter (älteste zuerst)' },
  { value: 'animal_number', label: 'Tiernummer (aufsteigend)' },
  { value: '-animal_number', label: 'Tiernummer (absteigend)' },
]

export const yesNoOptions: FilterOption<'1' | '0'>[] = [
  { value: '1', label: 'Ja' },
  { value: '0', label: 'Nein' },
]
