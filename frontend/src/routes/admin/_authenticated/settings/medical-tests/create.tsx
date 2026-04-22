import { createFileRoute } from '@tanstack/react-router'
import { MedicalTestCreatePage } from '@/admin/module/medical-tests/pages/MedicalTestCreatePage'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as MedicalTestsRoute } from '@/routes/admin/_authenticated/settings/medical-tests/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/medical-tests/create'
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
  const navigate = MedicalTestsRoute.useNavigate()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)

  const handleClose = () => {
    navigate({})
  }

  return (
    <MedicalTestCreatePage
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
