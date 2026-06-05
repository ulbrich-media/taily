import { queryOptions } from '@tanstack/react-query'
import {
  getFormTemplates,
  getFormTemplateVersions,
  getFormTemplate,
} from './requests'

export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  list: ['form-templates', 'list'] as const,
  versions: (formTemplateId: string) =>
    ['form-templates', 'versions', formTemplateId] as const,
  detail: (id: string) => ['form-templates', id] as const,
}

export const listFormTemplatesQuery = queryOptions({
  queryFn: getFormTemplates,
  queryKey: formTemplateQueryKeys.list,
})

export function formTemplateVersionsQuery(formTemplateId: string) {
  return queryOptions({
    queryFn: () => getFormTemplateVersions(formTemplateId),
    queryKey: formTemplateQueryKeys.versions(formTemplateId),
  })
}

export function formTemplateQuery(id: string) {
  return queryOptions({
    queryFn: () => getFormTemplate(id),
    queryKey: formTemplateQueryKeys.detail(id),
  })
}
