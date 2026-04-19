import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { listFormTemplatesQuery } from '@/admin/module/form-templates/api/queries'
import { AnimalTypeEditPage } from '@/admin/module/animal-types/pages/AnimalTypeEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$id/edit'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const [animalTypesData] = await Promise.all([
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(listFormTemplatesQuery),
    ])

    const animalType = animalTypesData.data.find((at) => at.id === params.id)

    if (!animalType) {
      throw new Response('Animal type not found', { status: 404 })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = AnimalTypesRoute.useNavigate()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)
  const { data: formTemplatesData } = useSuspenseQuery(listFormTemplatesQuery)
  const animalType = animalTypesData.data.find((at) => at.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return (
    <AnimalTypeEditPage
      animalType={animalType}
      formTemplates={formTemplatesData.data}
      onClose={handleClose}
    />
  )
}
