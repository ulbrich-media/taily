import { apiRequest } from '@/lib/api'
import type {
  CustomFieldDefinitionsParams,
  CustomFieldDefinitionsResponse,
  CustomFieldGroupInput,
  CustomFieldGroupMutationResponse,
  CustomFieldGroupResponse,
  CustomFieldGroupsResponse,
  DeleteCustomFieldGroupResponse,
  LinkableFieldsResponse,
} from './types'
import type { CustomFieldEntity } from '@/api/types/custom-fields'

export async function getCustomFieldGroups(): Promise<CustomFieldGroupsResponse> {
  return apiRequest<CustomFieldGroupsResponse>('custom-field-groups')
}

export async function getCustomFieldGroup(
  id: string
): Promise<CustomFieldGroupResponse> {
  return apiRequest<CustomFieldGroupResponse>(`custom-field-groups/${id}`)
}

export async function createCustomFieldGroup(
  data: CustomFieldGroupInput
): Promise<CustomFieldGroupMutationResponse> {
  return apiRequest<CustomFieldGroupMutationResponse>('custom-field-groups', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCustomFieldGroup(
  id: string,
  data: CustomFieldGroupInput
): Promise<CustomFieldGroupMutationResponse> {
  return apiRequest<CustomFieldGroupMutationResponse>(
    `custom-field-groups/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  )
}

/** Answers 409 with a removal impact unless `confirmRemoval` is set. */
export async function deleteCustomFieldGroup(
  id: string,
  confirmRemoval = false
): Promise<DeleteCustomFieldGroupResponse> {
  return apiRequest<DeleteCustomFieldGroupResponse>(
    `custom-field-groups/${id}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ confirm_custom_field_removal: confirmRemoval }),
    }
  )
}

export function buildDefinitionsQuery(
  params: CustomFieldDefinitionsParams
): string {
  const query = new URLSearchParams({ entity: params.entity })
  if ('record_id' in params && params.record_id) {
    query.set('record_id', params.record_id)
  }
  if ('animal_type_id' in params) {
    query.set('animal_type_id', params.animal_type_id)
  }
  return query.toString()
}

export async function getCustomFieldDefinitions(
  params: CustomFieldDefinitionsParams
): Promise<CustomFieldDefinitionsResponse> {
  return apiRequest<CustomFieldDefinitionsResponse>(
    `custom-fields/definitions?${buildDefinitionsQuery(params)}`
  )
}

/** Fields a "Feld übernehmen" field of a form template can link to. */
export async function getLinkableFields(
  entity: CustomFieldEntity
): Promise<LinkableFieldsResponse> {
  return apiRequest<LinkableFieldsResponse>(
    `custom-fields/linkable?entity=${entity}`
  )
}
