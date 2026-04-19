import { createFileRoute } from '@tanstack/react-router'
import { ApiTokenCreatePage } from '@/admin/module/api-tokens/pages/ApiTokenCreatePage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listApiTokenAbilitiesQuery } from '@/admin/module/api-tokens/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/api-tokens/create'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listApiTokenAbilitiesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = ApiTokensRoute.useNavigate()
  const { data: abilitiesData } = useSuspenseQuery(listApiTokenAbilitiesQuery)

  const handleClose = () => {
    navigate({})
  }

  return (
    <ApiTokenCreatePage abilities={abilitiesData.data} onClose={handleClose} />
  )
}
