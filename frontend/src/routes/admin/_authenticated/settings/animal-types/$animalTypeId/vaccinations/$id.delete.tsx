import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { listVaccinationsByAnimalTypeQuery } from '@/admin/module/vaccinations/api/queries'
import { VaccinationDeletePage } from '@/admin/module/vaccinations/pages/VaccinationDeletePage'
import { Route as VaccinationsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/vaccinations/$id/delete'
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
  },
  component: RouteComponent,
})

function RouteComponent() {
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
    <VaccinationDeletePage vaccination={vaccination} onClose={handleClose} />
  )
}
