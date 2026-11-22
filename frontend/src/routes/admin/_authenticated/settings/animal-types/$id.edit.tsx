import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { AnimalTypeEditPage } from '@/admin/module/animal-types/pages/AnimalTypeEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AnimalTypesRoute } from '@/routes/admin/_authenticated/settings/animal-types/route'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$id/edit'
)({
  staticData: { dialog: true },
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

    return {
      breadcrumb: `${animalType.title} bearbeiten`,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { id } = Route.useParams()
  const navigate = AnimalTypesRoute.useNavigate()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)
  const animalType = animalTypesData.data.find((at) => at.id === id)!

  const handleClose = () => {
    navigate({ search: true })
  }

  return (
    <AnimalTypeEditPage
      animalType={animalType}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
