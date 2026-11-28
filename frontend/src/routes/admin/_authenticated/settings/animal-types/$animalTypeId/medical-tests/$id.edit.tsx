import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsByAnimalTypeQuery } from '@/admin/module/medical-tests/api/queries'
import { MedicalTestEditPage } from '@/admin/module/medical-tests/pages/MedicalTestEditPage'
import { Route as MedicalTestsRoute } from './route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/medical-tests/$id/edit'
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

    return { breadcrumb: `${medicalTest.title} bearbeiten` }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
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
    <MedicalTestEditPage
      medicalTest={medicalTest}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
