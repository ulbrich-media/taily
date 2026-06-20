import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries'
import { AdoptionSidebar } from '@/admin/module/adoptions/components/AdoptionSidebar'
import { Route as AdoptionDetailRoute } from './adoption/route'
import { Route as HistoryRoute } from './history'
import { Route as MediatorEditRoute } from './adoption/mediator.tsx'
import { Edit, MoreVertical } from 'lucide-react'
import { PageHeader, tabLinkClass } from '@/components/layout/PageHeader.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shadcn/components/ui/dropdown-menu.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const mediatorEditLink = (
    <MediatorEditRoute.Link params={{ adoptionId }}>
      <Edit />
    </MediatorEditRoute.Link>
  )

  return (
    <>
      <div className="mb-6">
        <PageHeader
          title={`Vermittlung von ${adoption.animal.name}`}
          links={
            <>
              <AdoptionDetailRoute.Link
                params={{ adoptionId }}
                className={tabLinkClass}
              >
                Vermittlung
              </AdoptionDetailRoute.Link>
              <HistoryRoute.Link
                params={{ adoptionId }}
                className={tabLinkClass}
              >
                Verlauf
              </HistoryRoute.Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="size-4" />
                    <span className="sr-only">Optionen öffnen</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-destructive">
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        />
      </div>

      <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
        <AdoptionSidebar
          adoption={adoption}
          mediatorEditLink={mediatorEditLink}
        />

        <div className="space-y-6 mt-6 lg:mt-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
