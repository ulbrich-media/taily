import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getAnimalQuery } from '@/admin/module/animals/api/queries.ts'
import { listVaccinationsByAnimalTypeQuery } from '@/admin/module/vaccinations/api/queries'
import { listMedicalTestsByAnimalTypeQuery } from '@/admin/module/medical-tests/api/queries'
import { AnimalEditMedicalPage } from '@/admin/module/animals/pages/AnimalEditMedicalPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as VaccinationsRoute } from '@/routes/admin/_authenticated/settings/vaccinations/route'
import { Route as MedicalTestsRoute } from '@/routes/admin/_authenticated/settings/medical-tests/route'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalDetail/$animalTypeId/animal/$animalId/medical'
)({
  loader: async ({ params }) => {
    const animal = await queryClient.ensureQueryData(
      getAnimalQuery(params.animalId)
    )
    await Promise.all([
      queryClient.ensureQueryData(
        listVaccinationsByAnimalTypeQuery(animal.animal_type_id)
      ),
      queryClient.ensureQueryData(
        listMedicalTestsByAnimalTypeQuery(animal.animal_type_id)
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  const { data: animal } = useSuspenseQuery(getAnimalQuery(animalId))
  const { data: vaccinations } = useSuspenseQuery(
    listVaccinationsByAnimalTypeQuery(animal.animal_type_id)
  )
  const { data: medicalTests } = useSuspenseQuery(
    listMedicalTestsByAnimalTypeQuery(animal.animal_type_id)
  )

  const vaccinationsLink = (
    <VaccinationsRoute.Link>Impfungen verwalten</VaccinationsRoute.Link>
  )

  const medicalTestsLink = (
    <MedicalTestsRoute.Link>Tests verwalten</MedicalTestsRoute.Link>
  )

  return (
    <AnimalEditMedicalPage
      animal={animal}
      vaccinations={vaccinations}
      medicalTests={medicalTests}
      vaccinationsLink={vaccinationsLink}
      medicalTestsLink={medicalTestsLink}
    />
  )
}
