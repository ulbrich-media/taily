import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import type { TransportListResource } from '@/api/types/transports'
import { TransportEditPage } from '@/admin/module/transports/pages/TransportEditPage'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'
import { listPersonsQuery } from '@/lib/api/persons'

export const Route = createFileRoute(
  '/admin/_authenticated/transports/$transportId/edit'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(listPersonsQuery)

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
  const { data: persons } = useSuspenseQuery(listPersonsQuery)

  const mediators = persons.filter((p) => p.mediator_animal_types?.length > 0)

  return (
    <TransportEditPage
      transport={transport}
      mediators={mediators}
      onClose={() => navigate({})}
    />
  )
}
