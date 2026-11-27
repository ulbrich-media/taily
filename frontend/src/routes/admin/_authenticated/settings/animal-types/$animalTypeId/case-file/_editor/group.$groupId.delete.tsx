import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { FieldGroupDeleteDialog } from '@/admin/module/case-file-catalogue/pages/FieldGroupDeleteDialog'
import { Route as EditorRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file/_editor/group/$groupId/delete'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const catalogue = await queryClient.ensureQueryData(
      getCatalogueQuery(params.animalTypeId)
    )
    if (!catalogue.groups.some((g) => g.id === params.groupId)) throw notFound()
  },
  staticData: { breadcrumb: 'Abschnitt löschen', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId, groupId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))
  const group = catalogue.groups.find((g) => g.id === groupId)

  // The group is gone once the deletion went through.
  if (!group) return null

  return (
    <FieldGroupDeleteDialog
      animalTypeId={animalTypeId}
      group={group}
      onClose={() => navigate({ params: { animalTypeId } })}
    />
  )
}
