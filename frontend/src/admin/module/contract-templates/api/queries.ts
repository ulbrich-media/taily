import { queryOptions } from '@tanstack/react-query'
import {
  getContractFieldOptions,
  getContractTemplate,
  getContractTemplates,
} from './requests'

export const contractTemplateQueryKeys = {
  all: ['contract-templates'] as const,
  list: (animalTypeId?: string) =>
    ['contract-templates', 'list', animalTypeId ?? null] as const,
  detail: (id: string) => ['contract-templates', 'detail', id] as const,
  fieldOptions: () => ['contract-templates', 'field-options'] as const,
}

export const listContractTemplatesQuery = (animalTypeId?: string) =>
  queryOptions({
    queryKey: contractTemplateQueryKeys.list(animalTypeId),
    queryFn: () => getContractTemplates(animalTypeId),
  })

export const getContractTemplateQuery = (id: string) =>
  queryOptions({
    queryKey: contractTemplateQueryKeys.detail(id),
    queryFn: () => getContractTemplate(id),
  })

// Depends on the catalogues, so it is always refetched when a form opens.
export const getContractFieldOptionsQuery = () =>
  queryOptions({
    queryKey: contractTemplateQueryKeys.fieldOptions(),
    queryFn: getContractFieldOptions,
    staleTime: 0,
  })
