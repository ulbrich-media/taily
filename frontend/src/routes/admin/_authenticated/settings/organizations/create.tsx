import { createFileRoute } from '@tanstack/react-router'
import { OrganizationCreatePage } from '@/admin/module/organizations/pages/OrganizationCreatePage'
import { Route as OrganizationsListRoute } from '@/routes/admin/_authenticated/settings/organizations/index'
import { Route as OrganizationDetailRoute } from '@/routes/admin/_authenticated/settings/organizations/$id/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/create'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToDetail = OrganizationDetailRoute.useNavigate()
  const navigateToList = OrganizationsListRoute.useNavigate()

  const handleCreated = (id: string) => {
    navigateToDetail({ params: { id } })
  }

  const handleCancel = () => {
    navigateToList({})
  }

  return (
    <OrganizationCreatePage onCreated={handleCreated} onCancel={handleCancel} />
  )
}
