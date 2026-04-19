import { createFileRoute } from '@tanstack/react-router'
import { OrganizationDeletePage } from '@/admin/module/organizations/pages/OrganizationDeletePage'
import { queryClient } from '@/lib/queryClient'
import { organizationDetailQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as OrganizationsListRoute } from '@/routes/admin/_authenticated/settings/organizations/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/$id/delete'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(organizationDetailQuery(params.id))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = OrganizationsListRoute.useNavigate()
  const { data: organization } = useSuspenseQuery(organizationDetailQuery(id))

  const handleDeleted = () => {
    navigate({})
  }

  return (
    <OrganizationDeletePage
      organization={organization}
      onDeleted={handleDeleted}
    />
  )
}
