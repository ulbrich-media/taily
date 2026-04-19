import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { listUsersQuery } from '@/admin/module/users/api/queries'
import { UserDeletePage } from '@/admin/module/users/pages/UserDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as UsersRoute } from '@/routes/admin/_authenticated/settings/users/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/users/$id/delete'
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
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = UsersRoute.useNavigate()
  const { data: users } = useSuspenseQuery(listUsersQuery)
  const user = users.find((u) => u.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return <UserDeletePage user={user} onClose={handleClose} />
}
