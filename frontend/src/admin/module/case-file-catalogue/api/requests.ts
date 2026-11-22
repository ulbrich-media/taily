import { apiRequest } from '@/lib/api'
import type { CatalogueResource } from '@/api/types/case-file-catalogue'
import type {
  AdoptionStep,
  CaseFileCondition,
  CaseFileFieldOptions,
  CaseFileFieldType,
} from '@/api/types/case-file'

export interface CatalogueResponse {
  message: string
  data: CatalogueResource
}

export interface FieldGroupRequest {
  title: string
  intro: string
}

export interface FieldDefinitionRequest {
  // Only when creating: key and type are fixed afterwards.
  key?: string
  type?: CaseFileFieldType
  label: string
  help: string
  field_group_id?: string
  collect_at: AdoptionStep
  required_for: AdoptionStep | null
  requires_review?: boolean
  visible_to_applicant: boolean
  visible_to_inspector: boolean
  options?: CaseFileFieldOptions | null
  condition?: CaseFileCondition | null
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export const getCatalogue = (animalTypeId: string) =>
  apiRequest<CatalogueResource>(`animal-types/${animalTypeId}/catalogue`)

export const createFieldGroup = (
  animalTypeId: string,
  data: FieldGroupRequest
) =>
  apiRequest<CatalogueResponse>(
    `animal-types/${animalTypeId}/field-groups`,
    json('POST', data)
  )

export const updateFieldGroup = (groupId: string, data: FieldGroupRequest) =>
  apiRequest<CatalogueResponse>(`field-groups/${groupId}`, json('PUT', data))

export const deleteFieldGroup = (groupId: string) =>
  apiRequest<CatalogueResponse>(`field-groups/${groupId}`, json('DELETE'))

export const reorderFieldGroups = (animalTypeId: string, ids: string[]) =>
  apiRequest<CatalogueResponse>(
    `animal-types/${animalTypeId}/field-groups/order`,
    json('PUT', { ids })
  )

export const createFieldDefinition = (
  groupId: string,
  data: FieldDefinitionRequest
) =>
  apiRequest<CatalogueResponse>(
    `field-groups/${groupId}/fields`,
    json('POST', data)
  )

export const updateFieldDefinition = (
  fieldId: string,
  data: FieldDefinitionRequest
) =>
  apiRequest<CatalogueResponse>(
    `field-definitions/${fieldId}`,
    json('PUT', data)
  )

export const reorderFieldDefinitions = (groupId: string, ids: string[]) =>
  apiRequest<CatalogueResponse>(
    `field-groups/${groupId}/fields/order`,
    json('PUT', { ids })
  )

export const archiveFieldDefinition = (fieldId: string) =>
  apiRequest<CatalogueResponse>(
    `field-definitions/${fieldId}/archive`,
    json('POST')
  )

export const restoreFieldDefinition = (fieldId: string) =>
  apiRequest<CatalogueResponse>(
    `field-definitions/${fieldId}/archive`,
    json('DELETE')
  )

export const copyCatalogue = (animalTypeId: string, fromAnimalTypeId: string) =>
  apiRequest<CatalogueResponse>(
    `animal-types/${animalTypeId}/catalogue/copy`,
    json('POST', { from_animal_type_id: fromAnimalTypeId })
  )
