import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { AnimalEditPicturesPage } from '@/admin/module/animals/pages/AnimalEditPicturesPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/pictures'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getAnimalQuery(params.animalId))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))

  return <AnimalEditPicturesPage animal={animal} />
}
