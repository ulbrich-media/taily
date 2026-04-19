import { queryOptions } from '@tanstack/react-query'
import {
  getFormTemplates,
  getFormTemplateVersions,
  getFormTemplate,
} from './requests'

export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  list: ['form-templates', 'list'] as const,
  versions: (type: string) => ['form-templates', 'versions', type] as const,
  detail: (id: string) => ['form-templates', id] as const,
}

export const listFormTemplatesQuery = queryOptions({
  queryFn: getFormTemplates,
  queryKey: formTemplateQueryKeys.list,
})

export function formTemplateVersionsQuery(type: string) {
  return queryOptions({
    queryFn: () => getFormTemplateVersions(type),
    queryKey: formTemplateQueryKeys.versions(type),
  })
}

export function formTemplateQuery(id: string) {
  return queryOptions({
    queryFn: () => getFormTemplate(id),
    queryKey: formTemplateQueryKeys.detail(id),
  })
}
