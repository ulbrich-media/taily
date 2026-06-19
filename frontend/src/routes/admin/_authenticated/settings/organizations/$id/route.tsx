import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { organizationDetailQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { OrganizationSidebar } from '@/admin/module/organizations/components/OrganizationSidebar'
import { Route as BasicRoute } from './index'
import { Route as DeleteRoute } from './delete'
import { PageHeader, tabLinkClass } from '@/components/layout/PageHeader.tsx'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { MoreVertical } from 'lucide-react'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations/$id'
)({
  loader: async ({ params }) => {
    const organization = await queryClient.ensureQueryData(organizationDetailQuery(params.id))
    return { breadcrumb: organization.name }
  },
  component: RouteComponent,
})

const disabledTabClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground rounded-md opacity-50 pointer-events-none'

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { id } = Route.useParams()
  const { data: organization } = useSuspenseQuery(organizationDetailQuery(id))

  const deleteLink = (
    <DeleteRoute.Link params={{ id }}>Löschen</DeleteRoute.Link>
  )

  return (
    <>
      <div className="mb-6">
        <PageHeader
          breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
          title={organization.name}
          links={
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Optionen öffnen</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-destructive" asChild>
                    {deleteLink}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
        <OrganizationSidebar organization={organization} />

        <div className="space-y-6 mt-6 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
