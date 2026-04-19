import type { FormTemplateResource } from '@/api/types/form-templates'
import { FormBuilderEditor } from '../components/FormBuilderEditor'

interface FormTemplateResourceEditPageProps {
  template: FormTemplateResource
  onCancel: () => void
  onNewVersion: (id: string) => void
}

export function FormTemplateEditPage({
  template,
  onCancel,
  onNewVersion,
}: FormTemplateResourceEditPageProps) {
  return (
    <FormBuilderEditor
      template={template}
      onCancel={onCancel}
      onNewVersion={onNewVersion}
    />
  )
}
