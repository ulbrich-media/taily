import { createFileRoute } from '@tanstack/react-router'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { FieldGroupDialog } from '@/admin/module/case-file-catalogue/pages/FieldGroupDialog'
import { Route as EditorRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file/_editor/group/new'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  staticData: { breadcrumb: 'Neuer Abschnitt', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()

  return (
    <FieldGroupDialog
      animalTypeId={animalTypeId}
      onClose={() => navigate({ params: { animalTypeId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
