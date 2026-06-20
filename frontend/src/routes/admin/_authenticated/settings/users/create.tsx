import { createFileRoute } from '@tanstack/react-router'
import { UserCreatePage } from '@/admin/module/users/pages/UserCreatePage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as UsersRoute } from '@/routes/admin/_authenticated/settings/users/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/users/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  staticData: {
    breadcrumb: 'Neuen Benutzer erstellen',
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = UsersRoute.useNavigate()

  const handleClose = () => {
    navigate({})
  }

  return (
    <UserCreatePage
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
