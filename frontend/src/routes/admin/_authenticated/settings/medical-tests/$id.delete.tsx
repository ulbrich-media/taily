import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsQuery } from '@/admin/module/medical-tests/api/queries'
import { MedicalTestDeletePage } from '@/admin/module/medical-tests/pages/MedicalTestDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as MedicalTestsRoute } from '@/routes/admin/_authenticated/settings/medical-tests/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/medical-tests/$id/delete'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const medicalTestId = params.id

    const medicalTests = await queryClient.ensureQueryData(listMedicalTestsQuery)

    const medicalTest = medicalTests.find((t) => t.id === medicalTestId)

    if (!medicalTest) {
      throw new Response('Medical test not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = MedicalTestsRoute.useNavigate()
  const { data: medicalTests } = useSuspenseQuery(listMedicalTestsQuery)
  const medicalTest = medicalTests.find((t) => t.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <MedicalTestDeletePage medicalTest={medicalTest} onClose={handleClose} />
  )
}
