import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon } from 'lucide-react'
import { OrganizationListPage } from '@/admin/module/organizations/pages/OrganizationListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listOrganizationsPageQuery } from '@/admin/module/organizations/api/queries'
import {
  organizationListSearchDefaults,
  organizationListSearchSchema,
  toOrganizationListParams,
} from '@/admin/module/organizations/organization-list.search'
import { searchToRestore } from '@/components/list/remembered-list-search'
import { useListRoute } from '@/components/list/useListRoute'
import { Button } from '@/shadcn/components/ui/button'
import type { OrganizationResource } from '@/api/types/organizations'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/organizations/create'
import { Route as OrganizationDetailRoute } from '@/routes/admin/_authenticated/settings/organizations/$id/index'

const REMEMBER_KEY = 'organizations'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/'
)({
  validateSearch: organizationListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(organizationListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // search of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: organizationListSearchDefaults,
      key: REMEMBER_KEY,
      schema: organizationListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
  },
  loaderDeps: ({ search }) => toOrganizationListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing search or page on the open list must not hold the navigation
    // back; only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listOrganizationsPageQuery(deps))
      return
    }

    await queryClient.ensureQueryData(listOrganizationsPageQuery(deps))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: organizations, isPlaceholderData } = useQuery({
    ...listOrganizationsPageQuery(toOrganizationListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: organizations,
    rememberKey: REMEMBER_KEY,
  })

  // The loader fills the cache before this renders.
  if (!organizations) return null

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Organisation hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (organization: OrganizationResource) => (
    <Button size="sm" variant="outline" asChild>
      <OrganizationDetailRoute.Link params={{ id: organization.id }}>
        <Edit /> Bearbeiten
      </OrganizationDetailRoute.Link>
    </Button>
  )

  return (
    <OrganizationListPage
      organizations={organizations}
      search={search}
      isUpdating={isPlaceholderData}
      onSearchChange={handleSearchChange}
      createAction={createAction}
      renderRowActions={renderRowActions}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
