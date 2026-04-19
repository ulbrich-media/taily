import { createFileRoute } from '@tanstack/react-router'
import { OrganizationEditBasicPage } from '@/admin/module/organizations/pages/OrganizationEditBasicPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { organizationDetailQuery } from '@/admin/module/organizations/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/$id/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: organization } = useSuspenseQuery(organizationDetailQuery(id))

  return <OrganizationEditBasicPage organization={organization} />
}
