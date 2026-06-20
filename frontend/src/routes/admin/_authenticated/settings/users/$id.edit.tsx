import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listUsersQuery } from '@/admin/module/users/api/queries'
import { UserEditPage } from '@/admin/module/users/pages/UserEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as UsersRoute } from '@/routes/admin/_authenticated/settings/users/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/users/$id/edit'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const userId = params.id

    const users = await queryClient.ensureQueryData(listUsersQuery)

    const user = users.find((u) => u.id === userId)

    if (!user) {
      throw new Response('User not found', { status: 404 })
    }

    return {
      breadcrumb: `${user.name} bearbeiten`,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { id } = Route.useParams()
  const navigate = UsersRoute.useNavigate()
  const { data: users } = useSuspenseQuery(listUsersQuery)
  const user = users.find((u) => u.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <UserEditPage
      user={user}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
