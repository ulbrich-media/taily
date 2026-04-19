import { createFileRoute } from '@tanstack/react-router'
import { PersonEditAdoptionsPage } from '@/admin/module/people/pages/PersonEditAdoptionsPage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listPreInspectionsByPersonQuery } from '@/admin/module/pre-inspections/api/queries.ts'
import { listAdoptionsQuery } from '@/admin/module/adoptions/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import { Route as InspectionDetailRoute } from '@/routes/admin/_authenticated/pre-inspections/$id/index.tsx'
import { ExternalLink, Eye, Edit } from 'lucide-react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import type { PreInspectionResource } from '@/api/types/pre-inspections'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/adoptions'
)({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(listPreInspectionsByPersonQuery(params.id)),
      queryClient.ensureQueryData(
        listAdoptionsQuery({ applicant_id: params.id })
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: inspections } = useSuspenseQuery(
    listPreInspectionsByPersonQuery(id)
  )
  const { data: adoptions } = useSuspenseQuery(
    listAdoptionsQuery({ applicant_id: id })
  )

  const renderAdoptionDetailLink = (adoption: AdoptionListResource) => (
    <AdoptionDetailRoute.Link params={{ adoptionId: adoption.id }}>
      <ExternalLink className="size-4" />
      Öffnen
    </AdoptionDetailRoute.Link>
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
    <PersonEditAdoptionsPage
      inspections={inspections}
      adoptions={adoptions}
      renderAdoptionDetailLink={renderAdoptionDetailLink}
      renderInspectionDetailLink={renderInspectionDetailLink}
    />
  )
}
