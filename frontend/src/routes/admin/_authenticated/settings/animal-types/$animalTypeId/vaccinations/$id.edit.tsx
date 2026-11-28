import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listVaccinationsByAnimalTypeQuery } from '@/admin/module/vaccinations/api/queries'
import { VaccinationEditPage } from '@/admin/module/vaccinations/pages/VaccinationEditPage'
import { Route as VaccinationsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/vaccinations/$id/edit'
)({
  staticData: { dialog: true },
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const vaccinations = await queryClient.ensureQueryData(
      listVaccinationsByAnimalTypeQuery(params.animalTypeId)
    )

    const vaccination = vaccinations.find((v) => v.id === params.id)

    if (!vaccination) {
      throw new Response('Vaccination not found', { status: 404 })
    }

    return {
      breadcrumb: `${vaccination.title} bearbeiten`,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId, id } = Route.useParams()
  const navigate = VaccinationsRoute.useNavigate()
  const { data: vaccinations } = useSuspenseQuery(
    listVaccinationsByAnimalTypeQuery(animalTypeId)
  )
  const vaccination = vaccinations.find((v) => v.id === id)!

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <VaccinationEditPage
      vaccination={vaccination}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
