import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { AnimalEditStatusPage } from '@/admin/module/animals/pages/AnimalEditStatusPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/status'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAnimalQuery(params.animalId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))

  return <AnimalEditStatusPage animal={animal} />
}
