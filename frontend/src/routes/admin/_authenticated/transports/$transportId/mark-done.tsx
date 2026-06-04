import { createFileRoute, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { listTransportsQuery } from '@/admin/module/transports/api/queries'
import { TransportMarkDonePage } from '@/admin/module/transports/pages/TransportMarkDonePage'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'

export const Route = createFileRoute(
  '/admin/_authenticated/transports/$transportId/mark-done'
)({
  loader: async ({ params }) => {
    const transports = await queryClient.ensureQueryData(listTransportsQuery())

    const transport = transports.find((t) => t.id === params.transportId)
    if (!transport) {
      throw notFound()
    }
    if (transport.is_done) {
      throw new Error('Dieser Transport ist bereits abgeschlossen')
    }

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
