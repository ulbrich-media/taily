import { queryOptions } from '@tanstack/react-query'
import { getFormTemplates, getFormTemplate } from './requests'

export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  list: ['form-templates', 'list'] as const,
  detail: (id: string) => ['form-templates', id] as const,
}

export const listFormTemplatesQuery = queryOptions({
  queryFn: getFormTemplates,
  queryKey: formTemplateQueryKeys.list,
})

export function formTemplateQuery(id: string) {
  return queryOptions({
    queryFn: () => getFormTemplate(id),
    queryKey: formTemplateQueryKeys.detail(id),
  })
}
