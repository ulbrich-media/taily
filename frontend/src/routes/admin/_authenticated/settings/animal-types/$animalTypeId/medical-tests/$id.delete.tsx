import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsByAnimalTypeQuery } from '@/admin/module/medical-tests/api/queries'
import { MedicalTestDeletePage } from '@/admin/module/medical-tests/pages/MedicalTestDeletePage'
import { Route as MedicalTestsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/medical-tests/$id/delete'
)({
  staticData: { dialog: true },
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const medicalTests = await queryClient.ensureQueryData(
      listMedicalTestsByAnimalTypeQuery(params.animalTypeId)
    )

    const medicalTest = medicalTests.find((t) => t.id === params.id)

    if (!medicalTest) {
      throw new Response('Medical test not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId, id } = Route.useParams()
  const navigate = MedicalTestsRoute.useNavigate()
  const { data: medicalTests } = useSuspenseQuery(
    listMedicalTestsByAnimalTypeQuery(animalTypeId)
  )
  const medicalTest = medicalTests.find((t) => t.id === id)!

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <MedicalTestDeletePage medicalTest={medicalTest} onClose={handleClose} />
  )
}
