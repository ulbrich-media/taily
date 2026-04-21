import { createFileRoute } from '@tanstack/react-router'
import { VaccinationCreatePage } from '@/admin/module/vaccinations/pages/VaccinationCreatePage'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/vaccinations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as VaccinationsRoute } from '@/routes/admin/_authenticated/settings/vaccinations/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/vaccinations/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async () => {
    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = VaccinationsRoute.useNavigate()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)

  const handleClose = () => {
    navigate({})
  }

  return (
    <VaccinationCreatePage
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
