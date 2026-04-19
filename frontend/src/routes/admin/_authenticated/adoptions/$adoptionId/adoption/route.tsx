import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries'
import { listPreInspectionsByPersonAndAnimalTypeQuery } from '@/admin/module/pre-inspections/api/queries'
import { AdoptionDetailPage } from '@/admin/module/adoptions/pages/AdoptionDetailPage'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, Eye, PlusCircle } from 'lucide-react'
import { Route as PreInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/pre-inspection'
import { Route as NewInspectionRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/new-inspection'
import { Route as InspectionDetailRoute } from '@/routes/admin/_authenticated/pre-inspections/$id/index.tsx'
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

  const editPreInspectionAction = (
    <Button size="sm" variant="outline" asChild>
      <PreInspectionRoute.Link params={{ adoptionId }}>
        <Edit className="size-4" />
        Ergebnis bearbeiten
      </PreInspectionRoute.Link>
    </Button>
  )

  const newInspectionAction = (
    <Button size="sm" variant="outline" asChild>
      <NewInspectionRoute.Link params={{ adoptionId }}>
        <PlusCircle className="size-4" />
        Neue Kontrolle starten
      </NewInspectionRoute.Link>
    </Button>
  )

  const renderInspectionDetailLink = (inspection: PreInspectionResource) => (
    <InspectionDetailRoute.Link params={{ id: inspection.id }}>
      {inspection.verdict !== 'pending' ? (
        <>
          <Eye className="size-4" />
          <span>Öffnen</span>
        </>
      ) : (
        <>
          <Edit className="size-4" />
          <span>Bearbeiten</span>
        </>
      )}
    </InspectionDetailRoute.Link>
  )

  return (
    <>
      <AdoptionDetailPage
        adoption={adoption}
        inspectionsData={inspectionsData}
        inspectionsLoading={inspectionsLoading}
        inspectionsError={inspectionsError}
        editPreInspectionAction={editPreInspectionAction}
        newInspectionAction={newInspectionAction}
        renderInspectionDetailLink={renderInspectionDetailLink}
      />
      <Outlet />
    </>
  )
}
