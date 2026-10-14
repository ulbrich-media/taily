import { createFileRoute, redirect } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { getAdoptionQuery } from '@/admin/module/adoptions/api/queries.ts'
import { getContractView } from '@/admin/module/adoptions/contract.utils.ts'
import { AdoptionEditContractPage } from '@/admin/module/adoptions/pages/AdoptionEditContractPage'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/contract'
)({
  loader: async ({ params }) => {
    const adoption = await queryClient.ensureQueryData(
      getAdoptionQuery(params.adoptionId)
    )

    // A running or digitally completed signing process locks the contract
    // against manual edits (the backend rejects them too), so don't offer
    // the form at all if someone opens this URL directly.
    const view = getContractView(adoption)
    if (view === 'signing' || view === 'digital') {
      toast.error(
        view === 'signing'
          ? 'Es läuft ein Signaturvorgang. Bitte brich ihn ab, bevor du den Vertrag manuell bearbeitest.'
          : 'Der Vertrag wurde digital unterschrieben und kann nicht manuell geändert werden.'
      )
      throw redirect({
        to: '/admin/adoptions/$adoptionId/adoption',
        params: { adoptionId: params.adoptionId },
        replace: true,
      })
    }
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Vertrag erfassen',
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
    <AdoptionEditContractPage
      adoption={adoption}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
