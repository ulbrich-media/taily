import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { formTemplateQuery } from '@/admin/module/form-templates/api/queries'
import { FormTemplateViewPage } from '@/admin/module/form-templates/pages/FormTemplateViewPage'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/$formTemplateId/'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(formTemplateQuery(params.formTemplateId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { formTemplateId } = Route.useParams()
  const { data: template } = useSuspenseQuery(formTemplateQuery(formTemplateId))

  return <FormTemplateViewPage template={template.data} />
}
