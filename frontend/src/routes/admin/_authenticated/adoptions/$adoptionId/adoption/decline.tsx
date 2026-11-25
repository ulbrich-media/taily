import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries.ts'
import { AdoptionDeclinePage } from '@/admin/module/adoptions/pages/AdoptionDeclinePage'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/decline'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId))
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Bewerbung ablehnen',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionDeclinePage
      adoption={adoption}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
