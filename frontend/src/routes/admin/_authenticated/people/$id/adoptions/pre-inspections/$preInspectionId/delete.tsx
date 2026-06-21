import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPreInspectionQuery } from '@/admin/module/pre-inspections/api/queries'
import { PreInspectionDeletePage } from '@/admin/module/pre-inspections/pages/PreInspectionDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as PersonAdoptionsRoute } from '@/routes/admin/_authenticated/people/$id/adoptions/index'
import { Route as PreInspectionDetailRoute } from '@/routes/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId/route'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId/delete'
)({
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
  const { id, preInspectionId } = Route.useParams()
  const navigateToPersonAdoptions = PersonAdoptionsRoute.useNavigate()
  const navigateToDetail = PreInspectionDetailRoute.useNavigate()
  const { data: inspection } = useSuspenseQuery(
    getPreInspectionQuery(preInspectionId)
  )

  const handleDeleted = () => {
    navigateToPersonAdoptions({ params: { id } })
  }

  const handleClose = () => {
    navigateToDetail({ params: { id, preInspectionId } })
  }

  return (
    <PreInspectionDeletePage
      inspection={inspection}
      onDeleted={handleDeleted}
      onClose={handleClose}
    />
  )
}
