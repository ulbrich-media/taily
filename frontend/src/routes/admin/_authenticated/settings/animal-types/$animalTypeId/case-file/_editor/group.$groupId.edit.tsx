import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { FieldGroupDialog } from '@/admin/module/case-file-catalogue/pages/FieldGroupDialog'
import { Route as EditorRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file/_editor/group/$groupId/edit'
)({
  loader: async ({ params }) => {
    const catalogue = await queryClient.ensureQueryData(
      getCatalogueQuery(params.animalTypeId)
    )
    const group = catalogue.groups.find((g) => g.id === params.groupId)
    if (!group) throw notFound()
    return { breadcrumb: `${group.title} bearbeiten` }
  },
  staticData: { dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId, groupId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))
  const group = catalogue.groups.find((g) => g.id === groupId)!

  return (
    <FieldGroupDialog
      animalTypeId={animalTypeId}
      group={group}
      onClose={() => navigate({ params: { animalTypeId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
