import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PersonSidebar } from '@/admin/module/people/components/PersonSidebar.tsx'
import { PersonTabs } from '@/admin/module/people/components/PersonTabs.tsx'
import { Route as BasicRoute } from './index'
import { Route as RolesRoute } from './roles'
import { Route as AdoptionsRoute } from './adoptions'
import { Route as HistoryRoute } from './history'
import { Route as PicturesRoute } from './pictures'

export const Route = createFileRoute('/admin/_authenticated/people/$id')({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getPersonQuery(params.id)),
      queryClient.ensureQueryData(listOrganizationsQuery),
    ])
  },
  component: RouteComponent,
})

const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))

  const links = (
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
    </>
  )

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
      <PersonSidebar person={person} />

      <div className="space-y-6 mt-6 lg:mt-0">
        <PersonTabs
          links={links}
          onDelete={() => console.log('Delete person', id)}
        />
        <Outlet />
      </div>
    </div>
  )
}
