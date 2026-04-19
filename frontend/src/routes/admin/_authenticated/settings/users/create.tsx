import { createFileRoute } from '@tanstack/react-router'
import { UserCreatePage } from '@/admin/module/users/pages/UserCreatePage'
import { Route as UsersRoute } from '@/routes/admin/_authenticated/settings/users/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/users/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = UsersRoute.useNavigate()

  const handleClose = () => {
    navigate({})
  }

  return <UserCreatePage onClose={handleClose} />
}
