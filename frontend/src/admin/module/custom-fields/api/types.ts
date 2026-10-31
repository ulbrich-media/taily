// ---------------------------------------------------------------------------
// Response types (returned by the API)
// ---------------------------------------------------------------------------

import type {
  CustomFieldDefinitionGroup,
  CustomFieldEntity,
  CustomFieldGroupResource,
  CustomFieldPersonRole,
  CustomFieldSection,
  CustomFieldSettings,
  LinkableField,
} from '@/api/types/custom-fields'

export interface CustomFieldGroupsResponse {
  data: CustomFieldGroupResource[]
}
export interface CustomFieldGroupResponse {
  data: CustomFieldGroupResource
}
export interface CustomFieldGroupMutationResponse {
  message: string
  data: CustomFieldGroupResource
}
export interface DeleteCustomFieldGroupResponse {
  message: string
}
export interface CustomFieldDefinitionsResponse {
  data: CustomFieldDefinitionGroup[]
}
export interface LinkableFieldsResponse {
  data: LinkableField[]
}

// ---------------------------------------------------------------------------
// Request / input types (sent to the API — not resource shapes)
// ---------------------------------------------------------------------------

export interface CustomFieldGroupInput {
  entity: CustomFieldEntity
  section: CustomFieldSection
  /** Animal only; [] = every animal type. */
  animal_type_ids: string[]
  /** Person only; [] = every person. */
  person_roles: CustomFieldPersonRole[]
  form_template_id: string
  title: string
  position: number
  field_settings: CustomFieldSettings
}

/**
 * Which definitions to load:
 * - an existing record (`record_id`): the groups shown for it
 * - a new animal of a type (`animal_type_id`) or a new person (neither)
 */
export type CustomFieldDefinitionsParams =
  | { entity: 'animal'; record_id: string }
  | { entity: 'animal'; animal_type_id: string }
  | { entity: 'person'; record_id?: string }
