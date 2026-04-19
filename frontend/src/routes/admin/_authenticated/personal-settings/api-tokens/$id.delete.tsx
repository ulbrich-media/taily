import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { listApiTokensQuery } from '@/admin/module/api-tokens/api/queries.ts'
import { ApiTokenDeletePage } from '@/admin/module/api-tokens/pages/ApiTokenDeletePage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/api-tokens/$id/delete'
)({
  loader: async ({ params }) => {
    const tokens = await queryClient.ensureQueryData(listApiTokensQuery)

    const token = tokens.data.find((token) => token.id === params.id)

    if (!token) {
      throw new Response('Token not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = ApiTokensRoute.useNavigate()
  const { data: tokens } = useSuspenseQuery(listApiTokensQuery)
  const token = tokens.data.find((t) => t.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return <ApiTokenDeletePage token={token} onClose={handleClose} />
}
