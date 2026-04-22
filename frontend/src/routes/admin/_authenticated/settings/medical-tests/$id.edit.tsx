import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import {
  listMedicalTestsQuery,
  listAnimalTypesQuery,
} from '@/admin/module/medical-tests/api/queries'
import { MedicalTestEditPage } from '@/admin/module/medical-tests/pages/MedicalTestEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as MedicalTestsRoute } from '@/routes/admin/_authenticated/settings/medical-tests/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/medical-tests/$id/edit'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const medicalTestId = params.id

    const medicalTests = await queryClient.ensureQueryData(
      listMedicalTestsQuery
    )

    const medicalTest = medicalTests.find((t) => t.id === medicalTestId)

    if (!medicalTest) {
      throw new Response('Medical test not found', { status: 404 })
    }

    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = MedicalTestsRoute.useNavigate()
  const { data: medicalTests } = useSuspenseQuery(listMedicalTestsQuery)
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)
  const medicalTest = medicalTests.find((t) => t.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <MedicalTestEditPage
      medicalTest={medicalTest}
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
