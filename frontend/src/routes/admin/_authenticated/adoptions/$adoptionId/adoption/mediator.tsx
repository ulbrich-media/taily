import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
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
  staticData: {
    breadcrumb: 'Vermittler ändern',
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const { data: persons } = useSuspenseQuery(listPersonsQuery)

  const mediators = persons.filter((p) => p.mediator_animal_types?.length > 0)

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionEditMediatorPage
      adoption={adoption}
      mediators={mediators}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
