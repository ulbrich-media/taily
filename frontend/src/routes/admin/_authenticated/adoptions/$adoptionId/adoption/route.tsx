import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries'
import { listPreInspectionsByPersonAndAnimalTypeQuery } from '@/admin/module/pre-inspections/api/queries'
import { AdoptionDetailPage } from '@/admin/module/adoptions/pages/AdoptionDetailPage'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusCircle, Ban, RotateCcw, Truck, X } from 'lucide-react'
import { Route as InternalNotesRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/internal-notes'
import { Route as PreInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/pre-inspection'
import { Route as NewInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/new-inspection'
import { Route as ContractRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/contract'
import { Route as CancelRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/cancel'
import { Route as ReopenRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/reopen'
import { Route as TransportAssignRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/transport-assign'
import { Route as TransportRemoveRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/transport-remove'
import { Route as InspectionDetailRoute } from '@/routes/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId/index'
import type { PreInspectionResource } from '@/api/types/pre-inspections'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const animalTypeId = adoption.animal.animal_type_id
  const applicantId = adoption.applicant_id

  const {
    data: inspectionsData,
    isLoading: inspectionsLoading,
    isError: inspectionsError,
  } = useQuery(
    listPreInspectionsByPersonAndAnimalTypeQuery(applicantId, animalTypeId)
  )

  const editInternalNotesAction = (hasNote: boolean) => (
    <Button size="sm" variant="outline" asChild>
      <InternalNotesRoute.Link params={{ adoptionId }}>
        {hasNote ? (
          <>
            <Edit />
            Notizen bearbeiten
          </>
        ) : (
          <>
            <PlusCircle /> Notizen hinzufügen
          </>
        )}
      </InternalNotesRoute.Link>
    </Button>
  )

  const cancelAction = (
    <Button size="sm" variant="outline" asChild>
      <CancelRoute.Link params={{ adoptionId }}>
        <Ban />
        Vermittlung abbrechen
      </CancelRoute.Link>
    </Button>
  )

  const reopenAction = (
    <Button size="sm" variant="outline" asChild>
      <ReopenRoute.Link params={{ adoptionId }}>
        <RotateCcw />
        Vermittlung fortsetzen
      </ReopenRoute.Link>
    </Button>
  )

  const editContractAction = (
    <Button size="sm" variant="outline" asChild>
      <ContractRoute.Link params={{ adoptionId }}>
        <Edit />
        Schutzvertrag bearbeiten
      </ContractRoute.Link>
    </Button>
  )

  const editPreInspectionAction = (hasNote: boolean) => (
    <Button size="sm" variant="outline" asChild>
      <PreInspectionRoute.Link params={{ adoptionId }}>
        {hasNote ? (
          <>
            <Edit />
            Notizen bearbeiten
          </>
        ) : (
          <>
            <PlusCircle /> Notizen hinzufügen
          </>
        )}
      </PreInspectionRoute.Link>
    </Button>
  )

  const newInspectionAction = (
    <Button size="sm" variant="outline" asChild>
      <NewInspectionRoute.Link params={{ adoptionId }}>
        <PlusCircle />
        Neue Kontrolle starten
      </NewInspectionRoute.Link>
    </Button>
  )

  const renderInspectionDetailLink = (inspection: PreInspectionResource) => (
    <InspectionDetailRoute.Link
      params={{ id: applicantId, preInspectionId: inspection.id }}
    >
      {inspection.verdict !== 'pending' ? (
        <>
          <span>Öffnen</span>
        </>
      ) : (
        <>
          <Edit />
          <span>Bearbeiten</span>
        </>
      )}
    </InspectionDetailRoute.Link>
  )

  const assignTransportAction = (
    <Button size="sm" variant="outline" asChild>
      <TransportAssignRoute.Link params={{ adoptionId }}>
        <Truck />
        {adoption.transport_id ? 'Transport ändern' : 'Transport zuweisen'}
      </TransportAssignRoute.Link>
    </Button>
  )

  const removeTransportAction = adoption.transport_id ? (
    <Button size="sm" variant="outline" asChild>
      <TransportRemoveRoute.Link params={{ adoptionId }}>
        <X />
        Transport entfernen
      </TransportRemoveRoute.Link>
    </Button>
  ) : null

  return (
    <>
      <AdoptionDetailPage
        adoption={adoption}
        inspectionsData={inspectionsData}
        inspectionsLoading={inspectionsLoading}
        inspectionsError={inspectionsError}
        editInternalNotesAction={editInternalNotesAction}
        editContractAction={editContractAction}
        cancelAction={cancelAction}
        reopenAction={reopenAction}
        editPreInspectionAction={editPreInspectionAction}
        newInspectionAction={newInspectionAction}
        assignTransportAction={assignTransportAction}
        removeTransportAction={removeTransportAction}
        renderInspectionDetailLink={renderInspectionDetailLink}
      />
      <Outlet />
    </>
  )
}
