import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { listTransportsQuery } from '@/admin/module/transports/api/queries'
import { TransportListPage } from '@/admin/module/transports/pages/TransportListPage'
import { Route as AdoptionsListRoute } from '@/routes/admin/_authenticated/adoptions/_list/route'
import {
  AdoptionSectionTabs,
  adoptionSectionTabLinkClass,
} from '@/admin/module/adoptions/components/AdoptionSectionTabs'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/adoptions/transports/create'
import { Route as TransportDetailRoute } from '@/routes/admin/_authenticated/adoptions/transports/$transportId/index'
import type { TransportListResource } from '@/api/types/transports'
import { Button } from '@/shadcn/components/ui/button'
import { Plus, ExternalLink } from 'lucide-react'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/transports'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listTransportsQuery())
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: transports } = useSuspenseQuery(listTransportsQuery())

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <Plus />
        Transport anlegen
      </CreateRoute.Link>
    </Button>
  )

  const renderDetailAction = (transport: TransportListResource) => (
    <TransportDetailRoute.Link params={{ transportId: transport.id }}>
      <ExternalLink className="size-4" />
      Öffnen
    </TransportDetailRoute.Link>
  )

  return (
    <>
      <AdoptionSectionTabs>
        <AdoptionsListRoute.Link
          className={adoptionSectionTabLinkClass}
          activeOptions={{ exact: false }}
        >
          Vermittlungen
        </AdoptionsListRoute.Link>
        <Route.Link
          className={adoptionSectionTabLinkClass}
          activeOptions={{ exact: false }}
        >
          Transporte
        </Route.Link>
      </AdoptionSectionTabs>
      <TransportListPage
        transports={transports}
        createAction={createAction}
        renderDetailAction={renderDetailAction}
      />
      <Outlet />
    </>
  )
}
