import type { AdoptionStatus, AdoptionStepStatus } from '@/api/types/adoptions'
import type { FilterOption } from '@/components/list/toolbar-filters'
import {
  ADOPTION_STATUS_LABELS,
  STEP_STATUS_LABELS,
} from './adoption-status.labels'
import {
  ADOPTION_STATUSES,
  HANDOVER_STATUSES,
  STEP_STATUSES,
  type AdoptionListSearch,
} from './adoption-list.search'

export const statusOptions: FilterOption<AdoptionStatus>[] =
  ADOPTION_STATUSES.map((value) => ({
    value,
    label: ADOPTION_STATUS_LABELS[value],
  }))

export const stepStatusOptions: FilterOption<AdoptionStepStatus>[] =
  STEP_STATUSES.map((value) => ({ value, label: STEP_STATUS_LABELS[value] }))

export const handoverStatusOptions: FilterOption<
  (typeof HANDOVER_STATUSES)[number]
>[] = HANDOVER_STATUSES.map((value) => ({
  value,
  label: STEP_STATUS_LABELS[value],
}))

export const sortOptions: FilterOption<AdoptionListSearch['sort']>[] = [
  { value: '-created_at', label: 'Neueste zuerst' },
  { value: 'created_at', label: 'Älteste zuerst' },
  { value: '-updated_at', label: 'Zuletzt geändert' },
  { value: 'updated_at', label: 'Am längsten unverändert' },
  { value: 'animal_name', label: 'Tier (A–Z)' },
  { value: '-animal_name', label: 'Tier (Z–A)' },
  { value: 'applicant_name', label: 'Interessent (A–Z)' },
  { value: '-applicant_name', label: 'Interessent (Z–A)' },
  { value: 'mediator_name', label: 'Vermittler (A–Z)' },
  { value: '-mediator_name', label: 'Vermittler (Z–A)' },
]
