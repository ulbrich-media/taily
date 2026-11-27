import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { FieldArchiveDialog } from '@/admin/module/case-file-catalogue/pages/FieldArchiveDialog'
import type { CatalogueResource } from '@/api/types/case-file-catalogue'
import { Route as EditorRoute } from './index'

function findField(catalogue: CatalogueResource, id: string) {
  return catalogue.groups.flatMap((g) => g.fields).find((f) => f.id === id)
}

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file/_editor/field/$fieldId/archive'
)({
  loader: async ({ params }) => {
    const catalogue = await queryClient.ensureQueryData(
      getCatalogueQuery(params.animalTypeId)
    )
    if (!findField(catalogue, params.fieldId)) throw notFound()
  },
  staticData: { breadcrumb: 'Archivieren', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId, fieldId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))

  return (
    <FieldArchiveDialog
      animalTypeId={animalTypeId}
      field={findField(catalogue, fieldId)!}
      onClose={() => navigate({ params: { animalTypeId } })}
    />
  )
}
