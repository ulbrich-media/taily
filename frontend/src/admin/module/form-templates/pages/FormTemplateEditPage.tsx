import type { FormTemplateResource } from '@/api/types/form-templates'
import { FormBuilderEditor } from '../components/FormBuilderEditor'
import type { ReactNode } from 'react'

interface FormTemplateResourceEditPageProps {
  template: FormTemplateResource
  onCancel: () => void
  onSaved: (id: string) => void
  breadcrumb?: ReactNode
}

export function FormTemplateEditPage({
  template,
  onCancel,
  onSaved,
  breadcrumb,
}: FormTemplateResourceEditPageProps) {
  return (
    <FormBuilderEditor
      template={template}
      onCancel={onCancel}
      onSaved={onSaved}
      breadcrumb={breadcrumb}
    />
  )
}
