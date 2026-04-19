import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import {
  listHealthConditionsQuery,
  listAnimalTypesQuery,
} from '@/admin/module/health-conditions/api/queries.ts'
import { HealthConditionEditPage } from '@/admin/module/health-conditions/pages/HealthConditionEditPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as HealthConditionsRoute } from '@/routes/admin/_authenticated/settings/health-conditions/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/health-conditions/$id/edit'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const healthConditionId = params.id

    const healthConditions = await queryClient.ensureQueryData(
      listHealthConditionsQuery
    )

    const healthCondition = healthConditions.find(
      (condition) => condition.id === healthConditionId
    )

    if (!healthCondition) {
      throw new Response('Health condition not found', { status: 404 })
    }

    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = HealthConditionsRoute.useNavigate()
  const { data: healthConditions } = useSuspenseQuery(listHealthConditionsQuery)
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)
  const healthCondition = healthConditions.find((c) => c.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <HealthConditionEditPage
      healthCondition={healthCondition}
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
