import { queryOptions } from '@tanstack/react-query'
import {
  getFormTemplates,
  getFormTemplatesPage,
  getFormTemplate,
} from './requests'
import type { PlainListParams } from '@/components/list/plain-list-search'

export const formTemplateQueryKeys = {
  all: ['form-templates'] as const,
  // Prefix of every list query, so invalidating it covers all pages.
  list: ['form-templates', 'list'] as const,
  page: (params: PlainListParams) =>
    ['form-templates', 'list', 'page', params] as const,
  detail: (id: string) => ['form-templates', id] as const,
}

export const listFormTemplatesQuery = queryOptions({
  queryFn: getFormTemplates,
  queryKey: formTemplateQueryKeys.list,
})

export const listFormTemplatesPageQuery = (params: PlainListParams) =>
  queryOptions({
    queryFn: () => getFormTemplatesPage(params),
    queryKey: formTemplateQueryKeys.page(params),
  })

export function formTemplateQuery(id: string) {
  return queryOptions({
    queryFn: () => getFormTemplate(id),
    queryKey: formTemplateQueryKeys.detail(id),
  })
}
