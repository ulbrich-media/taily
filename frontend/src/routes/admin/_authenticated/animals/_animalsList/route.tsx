import { createFileRoute, Outlet } from '@tanstack/react-router'
import { z } from 'zod'
import { AnimalListPage } from '@/admin/module/animals/pages/AnimalListPage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries.ts'
import { listAnimalsQuery } from '@/admin/module/animals/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Plus, Pencil } from 'lucide-react'
import type { AnimalListResource } from '@/api/types/animals'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/animals/create'
import { Route as AnimalDetailRoute } from '@/routes/admin/_authenticated/animals/_animalDetail/$animalTypeId.animal.$animalId/route'

// Define the search params schema
const animalListSearchSchema = z.object({
  animal_type_id: z.string().optional(),
})

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalsList'
)({
  validateSearch: animalListSearchSchema,
  loaderDeps: ({ search: { animal_type_id } }) => ({ animal_type_id }),
  loader: async ({ deps: { animal_type_id } }) => {
    await Promise.all([
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(listAnimalsQuery({ animal_type_id })),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: animals } = useSuspenseQuery(
    listAnimalsQuery({ animal_type_id: search.animal_type_id })
  )
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)

  const handleAnimalTypeChange = (animalTypeId: string | undefined) => {
    navigate({
      to: '.',
      search: animalTypeId ? { animal_type_id: animalTypeId } : {},
      replace: true,
    })
  }

  const createAction = (
    <Button asChild>
      <CreateRoute.Link
        search={
          search.animal_type_id ? { animal_type_id: search.animal_type_id } : {}
        }
      >
        <Plus />
        Tier hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (animal: AnimalListResource) => (
    <Button size="sm" variant="outline" asChild>
      <AnimalDetailRoute.Link
        params={{ animalTypeId: animal.animal_type_id, animalId: animal.id }}
      >
        <Pencil /> Bearbeiten
      </AnimalDetailRoute.Link>
    </Button>
  )

  return (
    <>
      <AnimalListPage
        animals={animals}
        animalTypes={animalTypes.data}
        animalTypeId={search.animal_type_id}
        onAnimalTypeChange={handleAnimalTypeChange}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
