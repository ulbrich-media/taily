import type { FormTemplateResource } from '@/api/types/form-templates'
import { FormTemplateViewer } from '../components/FormTemplateViewer'

interface FormTemplateViewPageProps {
  template: FormTemplateResource
}

export function FormTemplateViewPage({ template }: FormTemplateViewPageProps) {
  return <FormTemplateViewer template={template} />
}
