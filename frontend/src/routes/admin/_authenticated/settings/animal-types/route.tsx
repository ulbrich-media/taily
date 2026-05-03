import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AnimalTypeListPage } from '@/admin/module/animal-types/pages/AnimalTypeListPage'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/animal-types/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/animal-types/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/animal-types/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listAnimalTypesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Tierart hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (animalType: AnimalTypeResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: animalType.id }}>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <DeleteRoute.Link params={{ id: animalType.id }}>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <AnimalTypeListPage
        animalTypes={animalTypesData.data}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
