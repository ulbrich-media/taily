import {
  createFileRoute,
  Outlet,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { UserListPage } from '@/admin/module/users/pages/UserListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listUsersPageQuery } from '@/admin/module/users/api/queries'
import {
  toUserListParams,
  userListSearchDefaults,
  userListSearchSchema,
} from '@/admin/module/users/user-list.search'
import { searchToRestore } from '@/components/list/remembered-list-search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { UserResource } from '@/api/types/users'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/users/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/users/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/users/$id.delete'

const REMEMBER_KEY = 'users'

export const Route = createFileRoute('/admin/_authenticated/settings/users')({
  staticData: { breadcrumb: 'Benutzer' },
  validateSearch: userListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(userListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // filters of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: userListSearchDefaults,
      key: REMEMBER_KEY,
      schema: userListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
  },
  // `view` is presentation only and must not trigger a reload.
  loaderDeps: ({ search }) => toUserListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing filters, sort or page on the open list must not hold the
    // navigation back; only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listUsersPageQuery(deps))
      return
    }

    await queryClient.ensureQueryData(listUsersPageQuery(deps))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: users, isPlaceholderData } = useQuery({
    ...listUsersPageQuery(toUserListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: users,
    rememberKey: REMEMBER_KEY,
  })

  // The loader fills the cache before this renders.
  if (!users) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link search>
        <PlusIcon />
        Benutzer hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (user: UserResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: user.id }} search>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive_outline" asChild>
            <DeleteRoute.Link params={{ id: user.id }} search>
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
        search={search}
        isAdmin={isAdmin}
        isUpdating={isPlaceholderData}
        onSearchChange={handleSearchChange}
        createAction={createAction}
        renderRowActions={renderRowActions}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      />
      <Outlet />
    </>
  )
}
