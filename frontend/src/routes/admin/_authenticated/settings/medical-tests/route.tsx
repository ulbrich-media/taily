import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MedicalTestListPage } from '@/admin/module/medical-tests/pages/MedicalTestListPage'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsQuery } from '@/admin/module/medical-tests/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import type { MedicalTestResource } from '@/api/types/medical-tests'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/medical-tests/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/medical-tests/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/medical-tests/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/medical-tests'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listMedicalTestsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data: medicalTests } = useSuspenseQuery(listMedicalTestsQuery)

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Test hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (medicalTest: MedicalTestResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: medicalTest.id }}>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive" asChild>
            <DeleteRoute.Link params={{ id: medicalTest.id }}>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <MedicalTestListPage
        medicalTests={medicalTests}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
