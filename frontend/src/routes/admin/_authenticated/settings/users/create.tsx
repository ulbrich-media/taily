import { createFileRoute } from '@tanstack/react-router'
import { UserCreatePage } from '@/admin/module/users/pages/UserCreatePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { listPeopleQuery } from '@/admin/module/people/api/queries'
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
  loader: async () => {
    await queryClient.ensureQueryData(listPeopleQuery)
  },
  staticData: {
    breadcrumb: 'Neuen Benutzer erstellen',
    dialog: true,
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = UsersRoute.useNavigate()
  const { data: persons } = useSuspenseQuery(listPeopleQuery)

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <UserCreatePage
      persons={persons}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
