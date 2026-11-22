import { createFileRoute } from '@tanstack/react-router'
import { AnimalTypeCreatePage } from '@/admin/module/animal-types/pages/AnimalTypeCreatePage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Neue Tierart erstellen',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = AnimalTypesRoute.useNavigate()

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <AnimalTypeCreatePage
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
