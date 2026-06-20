import type { FormTemplateResource } from '@/api/types/form-templates'
import { FormBuilderEditor } from '../components/FormBuilderEditor'
import type { ReactNode } from 'react'

interface FormTemplateResourceEditPageProps {
  template: FormTemplateResource
  onCancel: () => void
  onNewVersion: (id: string) => void
  breadcrumb?: ReactNode
}

export function FormTemplateEditPage({
  template,
  onCancel,
  onNewVersion,
  breadcrumb,
}: FormTemplateResourceEditPageProps) {
  return (
    <FormBuilderEditor
      template={template}
      onCancel={onCancel}
      onNewVersion={onNewVersion}
      breadcrumb={breadcrumb}
    />
  )
}
