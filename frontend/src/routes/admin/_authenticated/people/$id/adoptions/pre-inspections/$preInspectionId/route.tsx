import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPreInspectionQuery } from '@/admin/module/pre-inspections/api/queries'
import { listPeopleFilteredQuery } from '@/admin/module/people/api/queries'
import { PreInspectionEditPage } from '@/admin/module/pre-inspections/pages/PreInspectionEditPage'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button'
import { Trash2 } from 'lucide-react'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId/delete'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId'
)({
  loader: async ({ params }) => {
    const inspection = await queryClient.ensureQueryData(
      getPreInspectionQuery(params.preInspectionId)
    )
    await queryClient.ensureQueryData(
      listPeopleFilteredQuery({
        role: 'inspector',
        animal_type_id: inspection.animal_type_id,
      })
    )
  },
  staticData: { breadcrumb: 'Vorkontrolle' },
  component: RouteComponent,
})

function RouteComponent() {
  const { id, preInspectionId } = Route.useParams()
  const { data: inspection } = useSuspenseQuery(
    getPreInspectionQuery(preInspectionId)
  )
  const { data: inspectors = [] } = useSuspenseQuery(
    listPeopleFilteredQuery({
      role: 'inspector',
      animal_type_id: inspection.animal_type_id,
    })
  )

  const deleteAction = (
    <Button variant="destructive_outline" size="sm" asChild>
      <DeleteRoute.Link params={{ id, preInspectionId }}>
        <Trash2 className="h-4 w-4 mr-2" />
        Löschen
      </DeleteRoute.Link>
    </Button>
  )

  return (
    <>
      <PreInspectionEditPage
        inspection={inspection}
        inspectors={inspectors}
        deleteAction={deleteAction}
      />
      <Outlet />
    </>
  )
}
