import { createFileRoute } from '@tanstack/react-router'
import { TransportCreateDialog } from '@/admin/module/transports/components/TransportCreateDialog'
import { Route as TransportsRoute } from '@/routes/admin/_authenticated/adoptions/transports/route'
import { Route as TransportDetailRoute } from '@/routes/admin/_authenticated/adoptions/transports/$transportId/index'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/transports/create'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToTransports = TransportsRoute.useNavigate()
  const navigateToDetail = TransportDetailRoute.useNavigate()

  const handleCreated = (id: string) => {
    navigateToDetail({ params: { transportId: id } })
  }

  const handleClose = () => {
    navigateToTransports({})
  }

  return (
    <TransportCreateDialog onCreated={handleCreated} onClose={handleClose} />
  )
}
