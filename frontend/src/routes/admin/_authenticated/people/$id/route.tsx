import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PersonSidebar } from '@/admin/module/people/components/PersonSidebar.tsx'
import { Route as BasicRoute } from './index'
import { Route as RolesRoute } from './roles'
import { Route as AdoptionsRoute } from './adoptions'
import { Route as HistoryRoute } from './history'
import { Route as PicturesRoute } from './pictures'
import { PageHeader, tabLinkClass } from '@/components/layout/PageHeader.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { MoreVertical } from 'lucide-react'

export const Route = createFileRoute('/admin/_authenticated/people/$id')({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getPersonQuery(params.id)),
      queryClient.ensureQueryData(listOrganizationsQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))

  return (
    <>
      <div className="mb-6">
        <PageHeader
          title={person.full_name}
          description={
            person.organization
              ? `${person.organization.name}
          ${person.organization_role && ` · ${person.organization_role}`}`
              : undefined
          }
          links={
            <>
              <BasicRoute.Link
                params={{ id }}
                className={tabLinkClass}
                activeOptions={{ exact: true }}
              >
                Basis & Kontakt
              </BasicRoute.Link>
              <RolesRoute.Link params={{ id }} className={tabLinkClass}>
                Rollen
              </RolesRoute.Link>
              <AdoptionsRoute.Link params={{ id }} className={tabLinkClass}>
                Vermittlungen
              </AdoptionsRoute.Link>
              <HistoryRoute.Link params={{ id }} className={tabLinkClass}>
                Verlauf
              </HistoryRoute.Link>
              <PicturesRoute.Link params={{ id }} className={tabLinkClass}>
                Bilder
              </PicturesRoute.Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Optionen öffnen</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => console.log('Delete person', id)}
                    className="text-destructive"
                  >
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
        <PersonSidebar person={person} />

        <div className="space-y-6 mt-6 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
