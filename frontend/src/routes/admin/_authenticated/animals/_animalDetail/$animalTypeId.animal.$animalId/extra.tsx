import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { customFieldDefinitionsQuery } from '@/admin/module/custom-fields/api/queries'
import { AnimalEditExtraPage } from '@/admin/module/animals/pages/AnimalEditExtraPage.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/extra'
)({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getAnimalQuery(params.animalId)),
      queryClient.ensureQueryData(
        customFieldDefinitionsQuery({
          entity: 'animal',
          record_id: params.animalId,
        })
      ),
    ])
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Weitere Angaben',
  },
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: customFieldGroups } = useSuspenseQuery(
    customFieldDefinitionsQuery({ entity: 'animal', record_id: animalId })
  )

  return (
    <AnimalEditExtraPage
      animal={animal}
      customFieldGroups={customFieldGroups}
    />
  )
}
