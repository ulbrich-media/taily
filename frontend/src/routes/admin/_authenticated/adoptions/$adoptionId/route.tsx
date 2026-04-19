import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries'
import { AdoptionSidebar } from '@/admin/module/adoptions/components/AdoptionSidebar'
import { AdoptionTabs } from '@/admin/module/adoptions/components/AdoptionTabs'
import { Route as AdoptionDetailRoute } from './adoption/route'
import { Route as HistoryRoute } from './history'
import { Route as MediatorEditRoute } from './adoption/mediator.tsx'
import { Edit } from 'lucide-react'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
})

const tabLinkClass =
  'px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors [&.active]:bg-accent [&.active]:text-foreground'

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const links = (
    <>
      <AdoptionDetailRoute.Link
        params={{ adoptionId }}
        className={tabLinkClass}
      >
        Vermittlung
      </AdoptionDetailRoute.Link>
      <HistoryRoute.Link params={{ adoptionId }} className={tabLinkClass}>
        Verlauf
      </HistoryRoute.Link>
    </>
  )

  const mediatorEditLink = (
    <MediatorEditRoute.Link params={{ adoptionId }}>
      <Edit />
    </MediatorEditRoute.Link>
  )

  return (
    <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
      <AdoptionSidebar
        adoption={adoption}
        mediatorEditLink={mediatorEditLink}
      />

      <div className="space-y-6 mt-6 lg:mt-0">
        <AdoptionTabs links={links} />
        <Outlet />
      </div>
    </div>
  )
}
