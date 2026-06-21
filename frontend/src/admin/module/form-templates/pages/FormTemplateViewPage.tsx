import type { FormTemplateResource } from '@/api/types/form-templates'
import { FormTemplateViewer } from '../components/FormTemplateViewer'
import type { ReactNode } from 'react'

interface FormTemplateViewPageProps {
  template: FormTemplateResource
  breadcrumb: ReactNode
}

export function FormTemplateViewPage({
  template,
  breadcrumb,
}: FormTemplateViewPageProps) {
  return <FormTemplateViewer template={template} breadcrumb={breadcrumb} />
}
