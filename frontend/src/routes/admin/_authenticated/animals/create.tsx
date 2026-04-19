import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AnimalCreatePage } from '@/admin/module/animals/pages/AnimalCreatePage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/health-conditions/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AnimalDetailRoute } from '@/routes/admin/_authenticated/animals/_animalDetail/$animalTypeId.animal.$animalId/route'
import { Route as AnimalsListRoute } from '@/routes/admin/_authenticated/animals/_animalsList/route'

// Define the search params schema
const animalCreateSearchSchema = z.object({
  animal_type_id: z.string().optional(),
})

export const Route = createFileRoute('/admin/_authenticated/animals/create')({
  validateSearch: animalCreateSearchSchema,
  loader: async () => {
    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { animal_type_id: defaultAnimalTypeId } = Route.useSearch()
  const navigateToAnimalDetail = AnimalDetailRoute.useNavigate()
  const navigateToAnimalsList = AnimalsListRoute.useNavigate()
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)

  return (
    <AnimalCreatePage
      defaultAnimalTypeId={defaultAnimalTypeId}
      animalTypes={animalTypes.data}
      onCreated={(animalTypeId, animalId) =>
        navigateToAnimalDetail({
          params: { animalTypeId, animalId },
        })
      }
      onCancel={() =>
        navigateToAnimalsList({
          search: defaultAnimalTypeId
            ? { animal_type_id: defaultAnimalTypeId }
            : {},
        })
      }
    />
  )
}
