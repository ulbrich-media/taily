import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { organizationDetailQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { OrganizationSidebar } from '@/admin/module/organizations/components/OrganizationSidebar'
import { OrganizationTabs } from '@/admin/module/organizations/components/OrganizationTabs'
import { Route as BasicRoute } from './index'
import { Route as DeleteRoute } from './delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/$id'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(organizationDetailQuery(params.id))
  },
  component: RouteComponent,
})

const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

const disabledTabClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground rounded-md opacity-50 pointer-events-none'

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: organization } = useSuspenseQuery(organizationDetailQuery(id))

  const links = (
    <>
      <BasicRoute.Link
        params={{ id }}
        className={tabLinkClass}
        activeOptions={{ exact: true }}
      >
        Basis & Kontakt
      </BasicRoute.Link>
      <span className={disabledTabClass}>Vermittlungen</span>
      <span className={disabledTabClass}>Verlauf</span>
    </>
  )

  const deleteLink = (
    <DeleteRoute.Link params={{ id }}>Löschen</DeleteRoute.Link>
  )

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
      <OrganizationSidebar organization={organization} />

      <div className="space-y-6 mt-6 lg:mt-0">
        <OrganizationTabs links={links} deleteLink={deleteLink} />
        <Outlet />
      </div>
    </div>
  )
}
