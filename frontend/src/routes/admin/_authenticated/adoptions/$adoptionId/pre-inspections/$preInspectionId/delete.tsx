import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPreInspectionQuery } from '@/admin/module/pre-inspections/api/queries'
import { PreInspectionDeletePage } from '@/admin/module/pre-inspections/pages/PreInspectionDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionOverviewRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import { Route as PreInspectionDetailRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/pre-inspections/$preInspectionId/delete'
)({
  staticData: { dialog: true },
  loader: async ({ params }) => {
    const inspection = await queryClient.ensureQueryData(
      getPreInspectionQuery(params.preInspectionId)
    )

    if (!inspection) {
      throw new Response('Pre-inspection not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId, preInspectionId } = Route.useParams()
  const navigateToAdoption = AdoptionOverviewRoute.useNavigate()
  const navigateToDetail = PreInspectionDetailRoute.useNavigate()
  const { data: inspection } = useSuspenseQuery(
    getPreInspectionQuery(preInspectionId)
  )

  const handleDeleted = () => {
    navigateToAdoption({ params: { adoptionId } })
  }

  const handleClose = () => {
    navigateToDetail({ params: { adoptionId, preInspectionId } })
  }

  return (
    <PreInspectionDeletePage
      inspection={inspection}
      onDeleted={handleDeleted}
      onClose={handleClose}
    />
  )
}
