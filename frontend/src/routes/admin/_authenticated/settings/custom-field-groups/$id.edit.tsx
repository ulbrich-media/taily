import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { listFormTemplatesQuery } from '@/admin/module/form-templates/api/queries'
import { getCustomFieldGroupQuery } from '@/admin/module/custom-fields/api/queries'
import { CustomFieldGroupEditPage } from '@/admin/module/custom-fields/pages/CustomFieldGroupEditPage'
import { Route as ListRoute } from '@/routes/admin/_authenticated/settings/custom-field-groups/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/custom-field-groups/$id/edit'
)({
  staticData: { dialog: true },
  loader: async ({ params }) => {
    const [group] = await Promise.all([
      queryClient.ensureQueryData(getCustomFieldGroupQuery(params.id)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(listFormTemplatesQuery),
    ])
    return { breadcrumb: `${group.data.title} bearbeiten` }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { id } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: group } = useSuspenseQuery(getCustomFieldGroupQuery(id))
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)
  const { data: formTemplates } = useSuspenseQuery(listFormTemplatesQuery)

  return (
    <CustomFieldGroupEditPage
      group={group.data}
      animalTypes={animalTypes.data}
      formTemplates={formTemplates.data}
      onClose={() => navigate({})}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
