import { createFileRoute } from '@tanstack/react-router'
import { VaccinationCreatePage } from '@/admin/module/vaccinations/pages/VaccinationCreatePage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as VaccinationsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/vaccinations/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Neue Impfung erstellen',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId } = Route.useParams()
  const navigate = VaccinationsRoute.useNavigate()

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <VaccinationCreatePage
      animalTypeId={animalTypeId}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
