import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPreInspectionQuery } from '@/admin/module/pre-inspections/api/queries'
import { PreInspectionDeletePage } from '@/admin/module/pre-inspections/pages/PreInspectionDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as PersonAdoptionsRoute } from '@/routes/admin/_authenticated/people/$id/adoptions'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as PreInspectionDetailRoute } from '@/routes/admin/_authenticated/pre-inspections/$id/route'

export const Route = createFileRoute(
  '/admin/_authenticated/pre-inspections/$id/delete'
)({
  loader: async ({ params }) => {
    const inspection = await queryClient.ensureQueryData(
      getPreInspectionQuery(params.id)
    )

    if (!inspection) {
      throw new Response('Pre-inspection not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigateToPersonAdoptions = PersonAdoptionsRoute.useNavigate()
  const navigateToDashboard = DashboardRoute.useNavigate()
  const navigateToDetail = PreInspectionDetailRoute.useNavigate()
  const { data: inspection } = useSuspenseQuery(getPreInspectionQuery(id))

  const handleDeleted = () => {
    if (inspection.person_id) {
      navigateToPersonAdoptions({ params: { id: inspection.person_id } })
    } else {
      navigateToDashboard({})
    }
  }

  const handleClose = () => {
    navigateToDetail({ params: { id: inspection.id } })
  }

  return (
    <PreInspectionDeletePage
      inspection={inspection}
      onDeleted={handleDeleted}
      onClose={handleClose}
    />
  )
}
