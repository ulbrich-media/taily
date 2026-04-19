import { createFileRoute } from '@tanstack/react-router'
import { AnimalTypeCreatePage } from '@/admin/module/animal-types/pages/AnimalTypeCreatePage'
import { queryClient } from '@/lib/queryClient'
import { listFormTemplatesQuery } from '@/admin/module/form-templates/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/create'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async () => {
    await queryClient.ensureQueryData(listFormTemplatesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = AnimalTypesRoute.useNavigate()
  const { data: formTemplatesData } = useSuspenseQuery(listFormTemplatesQuery)

  const handleClose = () => {
    navigate({})
  }

  return (
    <AnimalTypeCreatePage
      formTemplates={formTemplatesData.data}
      onClose={handleClose}
    />
  )
}
