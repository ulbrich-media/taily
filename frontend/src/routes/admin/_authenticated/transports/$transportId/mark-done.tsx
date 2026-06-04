import { createFileRoute, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import {
  transportQueryKeys,
} from '@/admin/module/transports/api/queries'
import type { TransportListResource } from '@/api/types/transports'
import { TransportMarkDonePage } from '@/admin/module/transports/pages/TransportMarkDonePage'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'

export const Route = createFileRoute(
  '/admin/_authenticated/transports/$transportId/mark-done'
)({
  loader: ({ params }) => {
    const planned =
      queryClient.getQueryData<TransportListResource[]>(
        transportQueryKeys.list({ is_done: false })
      ) ?? []

    const transport = planned.find((t) => t.id === params.transportId)
    if (!transport) throw notFound()

    return transport
  },
  component: RouteComponent,
})

function RouteComponent() {
  const transport = Route.useLoaderData()
  const navigate = TransportsRoute.useNavigate()

  return (
    <TransportMarkDonePage transport={transport} onClose={() => navigate({})} />
  )
}
