import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { TransportCreateDialog } from '@/admin/module/transports/components/TransportCreateDialog'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'
import { listPersonsQuery } from '@/lib/api/persons'
import { useBreadcrumbs } from '@/router/useBreadcrumbs.ts'
import { BreadcrumbNav } from '@/router/BreadcrumbNav.tsx'

export const Route = createFileRoute('/admin/_authenticated/transports/create')(
  {
    loader: async () => {
      await queryClient.ensureQueryData(listPersonsQuery)
    },
    component: RouteComponent,
    staticData: {
      breadcrumb: 'Transport anlegen',
    },
  }
)

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = TransportsRoute.useNavigate()
  const { data: persons } = useSuspenseQuery(listPersonsQuery)

  const mediators = persons.filter((p) => p.mediator_animal_types?.length > 0)

  return (
    <TransportCreateDialog
      mediators={mediators}
      onCreated={() => navigate({})}
      onClose={() => navigate({})}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
