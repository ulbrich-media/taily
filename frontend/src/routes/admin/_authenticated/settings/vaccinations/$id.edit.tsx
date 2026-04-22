import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import {
  listVaccinationsQuery,
  listAnimalTypesQuery,
} from '@/admin/module/vaccinations/api/queries'
import { VaccinationEditPage } from '@/admin/module/vaccinations/pages/VaccinationEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as VaccinationsRoute } from '@/routes/admin/_authenticated/settings/vaccinations/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/vaccinations/$id/edit'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const vaccinationId = params.id

    const vaccinations = await queryClient.ensureQueryData(
      listVaccinationsQuery
    )

    const vaccination = vaccinations.find((v) => v.id === vaccinationId)

    if (!vaccination) {
      throw new Response('Vaccination not found', { status: 404 })
    }

    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = VaccinationsRoute.useNavigate()
  const { data: vaccinations } = useSuspenseQuery(listVaccinationsQuery)
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)
  const vaccination = vaccinations.find((v) => v.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <VaccinationEditPage
      vaccination={vaccination}
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
