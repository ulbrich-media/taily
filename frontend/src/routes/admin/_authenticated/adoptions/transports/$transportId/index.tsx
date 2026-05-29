import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getTransportQuery } from '@/admin/module/transports/api/queries'
import { TransportDetailDialog } from '@/admin/module/transports/components/TransportDetailDialog'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/adoptions/transports/route'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import { ExternalLink } from 'lucide-react'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/transports/$transportId/'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getTransportQuery(params.transportId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { transportId } = Route.useParams()
  const { data: transport } = useSuspenseQuery(getTransportQuery(transportId))
  const navigateToTransports = TransportsRoute.useNavigate()

  const renderAdoptionLink = (adoptionId: string) => (
    <AdoptionDetailRoute.Link params={{ adoptionId }}>
      <ExternalLink className="size-4 mr-1" />
      Vermittlung öffnen
    </AdoptionDetailRoute.Link>
  )

  return (
    <TransportDetailDialog
      transport={transport}
      onClose={() => navigateToTransports({})}
      renderAdoptionLink={renderAdoptionLink}
    />
  )
}
