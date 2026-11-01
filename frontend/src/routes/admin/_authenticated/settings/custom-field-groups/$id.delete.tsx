import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getCustomFieldGroupQuery } from '@/admin/module/custom-fields/api/queries'
import { CustomFieldGroupDeletePage } from '@/admin/module/custom-fields/pages/CustomFieldGroupDeletePage'
import { Route as ListRoute } from '@/routes/admin/_authenticated/settings/custom-field-groups/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/custom-field-groups/$id/delete'
)({
  staticData: { dialog: true },
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getCustomFieldGroupQuery(params.id))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: group } = useSuspenseQuery(getCustomFieldGroupQuery(id))

  return (
    <CustomFieldGroupDeletePage
      group={group.data}
      onClose={() => navigate({})}
    />
  )
}
