import { createFileRoute, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import type { TransportListResource } from '@/api/types/transports'
import { TransportDeletePage } from '@/admin/module/transports/pages/TransportDeletePage'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'

export const Route = createFileRoute(
  '/admin/_authenticated/transports/$transportId/delete'
)({
  loader: ({ params }) => {
    // We could do a single query to fetch both planned and done transports. Instead, we
    // replicate the parents route requests, so no additional requests are fired.
    const planned =
      queryClient.getQueryData<TransportListResource[]>(
        transportQueryKeys.list({ is_done: false })
      ) ?? []
    const done =
      queryClient.getQueryData<TransportListResource[]>(
        transportQueryKeys.list({ is_done: true })
      ) ?? []

    const transport = [...planned, ...done].find(
      (t) => t.id === params.transportId
    )
    if (!transport) throw notFound()

    return transport
  },
  component: RouteComponent,
})

function RouteComponent() {
  const transport = Route.useLoaderData()
  const navigate = TransportsRoute.useNavigate()

  return (
    <TransportDeletePage transport={transport} onClose={() => navigate({})} />
  )
}
