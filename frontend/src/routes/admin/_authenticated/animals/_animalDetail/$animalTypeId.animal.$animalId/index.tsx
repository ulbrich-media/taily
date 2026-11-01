import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries.ts'
import { AnimalEditBasicPage } from '@/admin/module/animals/pages/AnimalEditBasicPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { customFieldDefinitionsQuery } from '@/admin/module/custom-fields/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/'
)({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getAnimalQuery(params.animalId)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(
        customFieldDefinitionsQuery({
          entity: 'animal',
          record_id: params.animalId,
        })
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)
  const { data: customFieldGroups } = useSuspenseQuery(
    customFieldDefinitionsQuery({ entity: 'animal', record_id: animalId })
  )

  return (
    <AnimalEditBasicPage
      animal={animal}
      animalTypes={animalTypes.data}
      customFieldGroups={customFieldGroups}
    />
  )
}
