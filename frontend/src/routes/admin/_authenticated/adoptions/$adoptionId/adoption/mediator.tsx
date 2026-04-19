import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { listPersonsQuery } from '@/lib/api/persons'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries.ts'
import { AdoptionEditMediatorPage } from '@/admin/module/adoptions/pages/AdoptionEditMediatorPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/mediator'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(listPersonsQuery)
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const { data: persons } = useSuspenseQuery(listPersonsQuery)

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionEditMediatorPage
      adoption={adoption}
      persons={persons}
      onClose={handleClose}
    />
  )
}
