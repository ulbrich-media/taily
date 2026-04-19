import { createFileRoute, Outlet } from '@tanstack/react-router'
import { HealthConditionListPage } from '@/admin/module/health-conditions/pages/HealthConditionListPage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listHealthConditionsQuery } from '@/admin/module/health-conditions/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import type { HealthConditionResource } from '@/api/types/health-conditions'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/health-conditions/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/health-conditions/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/health-conditions/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/health-conditions'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listHealthConditionsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data: healthConditions } = useSuspenseQuery(listHealthConditionsQuery)

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Gesundheitszustand hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (condition: HealthConditionResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: condition.id }}>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <DeleteRoute.Link params={{ id: condition.id }}>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <HealthConditionListPage
        healthConditions={healthConditions}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
