import { createFileRoute } from '@tanstack/react-router'
import { OrganizationListPage } from '@/admin/module/organizations/pages/OrganizationListPage'
import { queryClient } from '@/lib/queryClient'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon } from 'lucide-react'
import type { OrganizationResource } from '@/api/types/organizations'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/organizations/create'
import { Route as OrganizationDetailRoute } from '@/routes/admin/_authenticated/settings/organizations/$id/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listOrganizationsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: organizations } = useSuspenseQuery(listOrganizationsQuery)

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
      createAction={createAction}
      renderRowActions={renderRowActions}
    />
  )
}
