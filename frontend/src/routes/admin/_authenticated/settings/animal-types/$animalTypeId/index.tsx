import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { getAnimalTypeQuery } from '@/admin/module/animal-types/api/queries'
import { AnimalTypeEditPage } from '@/admin/module/animal-types/pages/AnimalTypeEditPage'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { animalTypeId } = Route.useParams()
  const { data: animalType } = useSuspenseQuery(
    getAnimalTypeQuery(animalTypeId)
  )

  return <AnimalTypeEditPage animalType={animalType} readOnly={!isAdmin} />
}
