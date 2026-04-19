import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { AnimalTypeDeletePage } from '@/admin/module/animal-types/pages/AnimalTypeDeletePage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$id/delete'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const animalTypesData =
      await queryClient.ensureQueryData(listAnimalTypesQuery)

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
  const animalType = animalTypesData.data.find((at) => at.id === id)!

  const handleClose = () => {
    navigate({})
  }

  return <AnimalTypeDeletePage animalType={animalType} onClose={handleClose} />
}
