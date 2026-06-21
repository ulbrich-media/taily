import { createFileRoute } from '@tanstack/react-router'
import { FormBuilderCreate } from '@/admin/module/form-templates/components/FormBuilderCreate'
import { Route as ListRoute } from './index'
import { useBreadcrumbs } from '@/router/useBreadcrumbs.ts'
import { BreadcrumbNav } from '@/router/BreadcrumbNav.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/new'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  staticData: {
    breadcrumb: 'Neue Formularvorlage',
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = ListRoute.useNavigate()
  return (
    <FormBuilderCreate
      onCreated={() => navigate({})}
      onCancel={() => navigate({})}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
