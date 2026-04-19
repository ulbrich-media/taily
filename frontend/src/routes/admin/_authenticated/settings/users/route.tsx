import { createFileRoute, Outlet } from '@tanstack/react-router'
import { UserListPage } from '@/admin/module/users/pages/UserListPage'
import { queryClient } from '@/lib/queryClient'
import { listUsersQuery } from '@/admin/module/users/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import type { UserResource } from '@/api/types/users'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/users/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/users/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/users/$id.delete'

export const Route = createFileRoute('/admin/_authenticated/settings/users')({
  loader: async () => {
    await queryClient.ensureQueryData(listUsersQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data: users } = useSuspenseQuery(listUsersQuery)

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Benutzer hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (user: UserResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: user.id }}>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <DeleteRoute.Link params={{ id: user.id }}>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <UserListPage
        users={users}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
