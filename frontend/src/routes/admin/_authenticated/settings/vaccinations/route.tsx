import { createFileRoute, Outlet } from '@tanstack/react-router'
import { VaccinationListPage } from '@/admin/module/vaccinations/pages/VaccinationListPage'
import { queryClient } from '@/lib/queryClient.ts'
import { listVaccinationsQuery } from '@/admin/module/vaccinations/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import type { VaccinationResource } from '@/api/types/vaccinations'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/vaccinations/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/vaccinations/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/vaccinations/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/vaccinations'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listVaccinationsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data: vaccinations } = useSuspenseQuery(listVaccinationsQuery)

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Impfung hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (vaccination: VaccinationResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: vaccination.id }}>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <DeleteRoute.Link params={{ id: vaccination.id }}>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <VaccinationListPage
        vaccinations={vaccinations}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
