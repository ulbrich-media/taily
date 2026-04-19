import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { listHealthConditionsByAnimalTypeQuery } from '@/admin/module/health-conditions/api/queries'
import { AnimalEditMedicalPage } from '@/admin/module/animals/pages/AnimalEditMedicalPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as HealthConditionRoute } from '@/routes/admin/_authenticated/settings/health-conditions/index.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/medical'
)({
  loader: async ({ params }) => {
    const animal = await queryClient.ensureQueryData(
      getAnimalQuery(params.animalId)
    )
    await queryClient.ensureQueryData(
      listHealthConditionsByAnimalTypeQuery(animal.animal_type_id)
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: healthConditions } = useSuspenseQuery(
    listHealthConditionsByAnimalTypeQuery(animal.animal_type_id)
  )

  const healthConditionsLink = (
    <HealthConditionRoute.Link>
      Gesundheitszustände verwalten
    </HealthConditionRoute.Link>
  )

  return (
    <AnimalEditMedicalPage
      animal={animal}
      healthConditions={healthConditions}
      healthConditionsLink={healthConditionsLink}
    />
  )
}
