import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries'
import { listPeopleFilteredQuery } from '@/admin/module/people/api/queries'
import { TriggerPreInspectionDialog } from '@/admin/module/pre-inspections/components/TriggerPreInspectionDialog'
import { Route as AdoptionRoute } from '../index.tsx'
import { Route as PreInspectionDetailRoute } from '@/routes/admin/_authenticated/pre-inspections/$id/index.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/new-inspection'
)({
  loader: async ({ params }) => {
    const adoption = await queryClient.ensureQueryData(
      getAdoptionQuery(params.adoptionId)
    )
    await queryClient.ensureQueryData(
      listPeopleFilteredQuery({
        role: 'inspector',
        animal_type_id: adoption.animal.animal_type_id,
      })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const navigateToAdoption = AdoptionRoute.useNavigate()
  const navigateToInspection = PreInspectionDetailRoute.useNavigate()

  const applicantId = adoption.applicant_id
  const animalTypeId = adoption.animal.animal_type_id

  const { data: inspectors } = useSuspenseQuery(
    listPeopleFilteredQuery({ role: 'inspector', animal_type_id: animalTypeId })
  )

  const handleClose = (open: boolean) => {
    if (!open) {
      navigateToAdoption({
        params: { adoptionId },
      })
    }
  }

  return (
    <TriggerPreInspectionDialog
      open
      onOpenChange={handleClose}
      applicantId={applicantId}
      animalTypeId={animalTypeId}
      inspectors={inspectors}
      onCreated={(id) =>
        navigateToInspection({ params: { id }, replace: true })
      }
    />
  )
}
