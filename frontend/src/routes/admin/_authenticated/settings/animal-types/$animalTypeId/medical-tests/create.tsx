import { createFileRoute } from '@tanstack/react-router'
import { MedicalTestCreatePage } from '@/admin/module/medical-tests/pages/MedicalTestCreatePage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as MedicalTestsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/medical-tests/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Neuen Test erstellen',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId } = Route.useParams()
  const navigate = MedicalTestsRoute.useNavigate()

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <MedicalTestCreatePage
      animalTypeId={animalTypeId}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
