import { createFileRoute, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { formTemplateQuery } from '@/admin/module/form-templates/api/queries'
import { FormTemplateEditPage } from '@/admin/module/form-templates/pages/FormTemplateEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as ListRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/$formTemplateId/edit'
)({
  loader: async ({ params }) => {
    const response = await queryClient.ensureQueryData(
      formTemplateQuery(params.formTemplateId)
    )

    if (!response) {
      throw notFound()
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { formTemplateId } = Route.useParams()
  const { data: template } = useSuspenseQuery(formTemplateQuery(formTemplateId))
  const navigateToList = ListRoute.useNavigate()
  const navigateToEdit = Route.useNavigate()

  return (
    <FormTemplateEditPage
      template={template.data}
      onCancel={() => navigateToList({})}
      onNewVersion={(id) => navigateToEdit({ params: { formTemplateId: id } })}
    />
  )
}
