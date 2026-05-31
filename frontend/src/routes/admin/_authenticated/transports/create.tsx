import { createFileRoute } from '@tanstack/react-router'
import { TransportCreateDialog } from '@/admin/module/transports/components/TransportCreateDialog'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/transports/route'

export const Route = createFileRoute('/admin/_authenticated/transports/create')(
  {
    component: RouteComponent,
  }
)

function RouteComponent() {
  const navigate = TransportsRoute.useNavigate()

  return (
    <TransportCreateDialog
      onCreated={() => navigate({})}
      onClose={() => navigate({})}
    />
  )
}
