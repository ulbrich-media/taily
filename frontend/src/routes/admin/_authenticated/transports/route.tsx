import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { listTransportsQuery } from '@/admin/module/transports/api/queries'
import { TransportListPage } from '@/admin/module/transports/pages/TransportListPage'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/transports/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/transports/$transportId/edit'
import { Route as MarkDoneRoute } from '@/routes/admin/_authenticated/transports/$transportId/mark-done'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/transports/$transportId/delete'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import type { TransportListResource } from '@/api/types/transports'
import type { AdoptionListResource } from '@/api/types/adoptions.ts'
import { Button } from '@/shadcn/components/ui/button'
import { CheckCircle2, Pencil, Plus, Trash2, ExternalLink } from 'lucide-react'

export const Route = createFileRoute('/admin/_authenticated/transports')({
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(listTransportsQuery({ is_done: false })),
      queryClient.ensureQueryData(listTransportsQuery({ is_done: true })),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: plannedTransports } = useSuspenseQuery(
    listTransportsQuery({ is_done: false })
  )
  const { data: doneTransports } = useSuspenseQuery(
    listTransportsQuery({ is_done: true })
  )

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <Plus />
        Transport anlegen
      </CreateRoute.Link>
    </Button>
  )

  const createActionForEmpty = (
    <Button asChild variant="secondary" size="sm">
      <CreateRoute.Link>
        <Plus />
        Transport anlegen
      </CreateRoute.Link>
    </Button>
  )

  const renderActions = (transport: TransportListResource) => (
    <>
      <Button size="icon-sm" variant="destructive" asChild aria-label="Löschen">
        <DeleteRoute.Link params={{ transportId: transport.id }}>
          <Trash2 className="size-4" />
        </DeleteRoute.Link>
      </Button>
      {!transport.is_done && (
        <Button size="sm" variant="outline" asChild>
          <MarkDoneRoute.Link params={{ transportId: transport.id }}>
            <CheckCircle2 className="size-4" />
            Abschließen
          </MarkDoneRoute.Link>
        </Button>
      )}
      <Button size="sm" variant="outline" asChild>
        <EditRoute.Link params={{ transportId: transport.id }}>
          <Pencil className="size-4" />
          Bearbeiten
        </EditRoute.Link>
      </Button>
    </>
  )

  const renderAdoptionDetailLink = (adoption: AdoptionListResource) => (
    <AdoptionDetailRoute.Link params={{ adoptionId: adoption.id }}>
      <ExternalLink className="size-4" />
      Öffnen
    </AdoptionDetailRoute.Link>
  )

  return (
    <>
      <TransportListPage
        plannedTransports={plannedTransports}
        doneTransports={doneTransports}
        createAction={createAction}
        createActionForEmpty={createActionForEmpty}
        renderActions={renderActions}
        renderAdoptionDetailLink={renderAdoptionDetailLink}
      />
      <Outlet />
    </>
  )
}
