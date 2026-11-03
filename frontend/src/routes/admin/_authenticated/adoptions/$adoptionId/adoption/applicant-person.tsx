import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listPeopleQuery } from '@/admin/module/people/api/queries.ts'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries.ts'
import { AdoptionLinkPersonPage } from '@/admin/module/adoptions/pages/AdoptionLinkPersonPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/applicant-person'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(listPeopleQuery)
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Mit Person verknüpfen',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const { data: persons } = useSuspenseQuery(listPeopleQuery)

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionLinkPersonPage
      adoption={adoption}
      persons={persons}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
