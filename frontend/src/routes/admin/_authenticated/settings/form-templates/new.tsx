import { createFileRoute } from '@tanstack/react-router'
import { FormBuilderCreate } from '@/admin/module/form-templates/components/FormBuilderCreate'
import { Route as ListRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/new'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = ListRoute.useNavigate()
  return (
    <FormBuilderCreate
      onCreated={() => navigate({})}
      onCancel={() => navigate({})}
    />
  )
}
