import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import {
  getAdoptionQuery,
  getContractTemplatesQuery,
} from '@/admin/module/adoptions/api/queries.ts'
import { AdoptionStartContractSigningPage } from '@/admin/module/adoptions/pages/AdoptionStartContractSigningPage'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/contract-signing'
)({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getAdoptionQuery(params.adoptionId)),
      queryClient.ensureQueryData(getContractTemplatesQuery()),
    ])
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Signaturvorgang starten',
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: adoption } = useSuspenseQuery(getAdoptionQuery(adoptionId))
  const { data: templates } = useSuspenseQuery(getContractTemplatesQuery())

  const handleClose = () => {
    navigate({ params: { adoptionId } })
  }

  return (
    <AdoptionStartContractSigningPage
      adoption={adoption}
      templates={templates}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
