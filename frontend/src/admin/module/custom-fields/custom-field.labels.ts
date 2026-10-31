import type {
  CustomFieldEntity,
  CustomFieldPersonRole,
  CustomFieldSection,
} from '@/api/types/custom-fields'

export const CUSTOM_FIELD_ENTITY_LABELS: Record<CustomFieldEntity, string> = {
  animal: 'Tier',
  person: 'Person',
}

/** Sections per entity, in display order (mirrors the backend enum). */
export const CUSTOM_FIELD_SECTIONS: Record<
  CustomFieldEntity,
  { value: CustomFieldSection; label: string }[]
> = {
  animal: [
    { value: 'basic', label: 'Basis' },
    { value: 'extra', label: 'Weitere Angaben' },
  ],
  person: [{ value: 'basic', label: 'Basis & Kontakt' }],
}

export function customFieldSectionLabel(
  entity: CustomFieldEntity,
  section: CustomFieldSection
): string {
  return (
    CUSTOM_FIELD_SECTIONS[entity].find((s) => s.value === section)?.label ??
    section
  )
}

export const CUSTOM_FIELD_PERSON_ROLES: {
  value: CustomFieldPersonRole
  label: string
}[] = [
  { value: 'adopter', label: 'Adoptant' },
  { value: 'mediator', label: 'Vermittler' },
  { value: 'inspector', label: 'Kontrolleur' },
  { value: 'foster', label: 'Pflegestelle' },
]

export function customFieldPersonRoleLabel(role: CustomFieldPersonRole) {
  return CUSTOM_FIELD_PERSON_ROLES.find((r) => r.value === role)?.label ?? role
}
