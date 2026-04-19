import { createFileRoute } from '@tanstack/react-router'
import { HealthConditionCreatePage } from '@/admin/module/health-conditions/pages/HealthConditionCreatePage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/health-conditions/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as HealthConditionsRoute } from '@/routes/admin/_authenticated/settings/health-conditions/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/health-conditions/create'
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
  const navigate = HealthConditionsRoute.useNavigate()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)

  const handleClose = () => {
    navigate({})
  }

  return (
    <HealthConditionCreatePage
      animalTypes={animalTypesData.data}
      onClose={handleClose}
    />
  )
}
