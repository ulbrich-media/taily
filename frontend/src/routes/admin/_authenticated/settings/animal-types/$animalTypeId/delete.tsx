import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getAnimalTypeQuery } from '@/admin/module/animal-types/api/queries'
import { AnimalTypeDeletePage } from '@/admin/module/animal-types/pages/AnimalTypeDeletePage'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/delete'
)({
  staticData: { dialog: true },
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId } = Route.useParams()
  const navigate = Route.useNavigate()
  const { data: animalType } = useSuspenseQuery(
    getAnimalTypeQuery(animalTypeId)
  )

  return (
    <AnimalTypeDeletePage
      animalType={animalType}
      onClose={() =>
        navigate({
          to: '/admin/settings/animal-types/$animalTypeId',
          params: { animalTypeId },
        })
      }
      onDeleted={() =>
        navigate({ to: '/admin/settings/animal-types', search: true })
      }
    />
  )
}
