import { queryOptions } from '@tanstack/react-query'
import {
  getCustomFieldDefinitions,
  getCustomFieldGroup,
  getCustomFieldGroups,
  getLinkableFields,
} from './requests'
import type { CustomFieldDefinitionsParams } from './types'
import type { CustomFieldEntity } from '@/api/types/custom-fields'

export const customFieldQueryKeys = {
  all: ['custom-fields'] as const,
  groups: ['custom-fields', 'groups'] as const,
  group: (id: string) => ['custom-fields', 'groups', id] as const,
  // Prefix of every definitions query of an entity.
  definitions: (entity: CustomFieldEntity) =>
    ['custom-fields', 'definitions', entity] as const,
  definitionsFor: (params: CustomFieldDefinitionsParams) =>
    ['custom-fields', 'definitions', params.entity, params] as const,
  linkable: (entity: CustomFieldEntity) =>
    ['custom-fields', 'linkable', entity] as const,
}

export const listCustomFieldGroupsQuery = queryOptions({
  queryKey: customFieldQueryKeys.groups,
  queryFn: getCustomFieldGroups,
})

export const getCustomFieldGroupQuery = (id: string) =>
  queryOptions({
    queryKey: customFieldQueryKeys.group(id),
    queryFn: () => getCustomFieldGroup(id),
  })

/** Definitions of a record or a new record; see CustomFieldDefinitionsParams. */
export const customFieldDefinitionsQuery = (
  params: CustomFieldDefinitionsParams
) =>
  queryOptions({
    queryKey: customFieldQueryKeys.definitionsFor(params),
    queryFn: () => getCustomFieldDefinitions(params),
    select: (response) => response.data,
  })

/** Fields of an entity a "Feld übernehmen" field can link to. */
export const linkableFieldsQuery = (entity: CustomFieldEntity) =>
  queryOptions({
    queryKey: customFieldQueryKeys.linkable(entity),
    queryFn: () => getLinkableFields(entity),
    select: (response) => response.data,
  })
