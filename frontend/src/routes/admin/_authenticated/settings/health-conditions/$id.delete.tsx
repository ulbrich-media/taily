import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { listHealthConditionsQuery } from '@/admin/module/health-conditions/api/queries.ts'
import { HealthConditionDeletePage } from '@/admin/module/health-conditions/pages/HealthConditionDeletePage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as HealthConditionsRoute } from '@/routes/admin/_authenticated/settings/health-conditions/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/health-conditions/$id/delete'
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
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = HealthConditionsRoute.useNavigate()
  const { data: healthConditions } = useSuspenseQuery(listHealthConditionsQuery)
  const healthCondition = healthConditions.find((c) => c.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <HealthConditionDeletePage
      healthCondition={healthCondition}
      onClose={handleClose}
    />
  )
}
