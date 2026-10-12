import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries.ts'
import { AdoptionCancelContractSigningPage } from '@/admin/module/adoptions/pages/AdoptionCancelContractSigningPage'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/contract-signing-cancel'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Signaturvorgang abbrechen',
  },
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionCancelContractSigningPage
      adoption={adoption}
      onClose={handleClose}
    />
  )
}
