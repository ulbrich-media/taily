import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { AnimalEditPlacementPage } from '@/admin/module/animals/pages/AnimalEditPlacementPage.tsx'
import {
  listPeopleFilteredQuery,
  listPeopleQuery,
} from '@/admin/module/people/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/placement'
)({
  loader: async ({ params }) => {
    const animal = await queryClient.ensureQueryData(
      getAnimalQuery(params.animalId)
    )
    await queryClient.ensureQueryData(listPeopleQuery)
    await queryClient.ensureQueryData(
      listPeopleFilteredQuery({
        animal_type_id: animal.animal_type_id,
        role: 'mediator',
      })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()

  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: persons } = useSuspenseQuery(listPeopleQuery)
  const { data: mediators } = useSuspenseQuery(
    listPeopleFilteredQuery({
      animal_type_id: animal.animal_type_id,
      role: 'mediator',
    })
  )

  return (
    <AnimalEditPlacementPage
      animal={animal}
      mediators={mediators}
      persons={persons}
    />
  )
}
