import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries.ts'
import { AnimalEditBasicPage } from '@/admin/module/animals/pages/AnimalEditBasicPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/'
)({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getAnimalQuery(params.animalId)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)

  return <AnimalEditBasicPage animal={animal} animalTypes={animalTypes.data} />
}
