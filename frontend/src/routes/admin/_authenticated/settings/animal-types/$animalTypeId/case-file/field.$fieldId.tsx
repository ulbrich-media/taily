import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { FieldDefinitionPage } from '@/admin/module/case-file-catalogue/pages/FieldDefinitionPage'
import type { CatalogueResource } from '@/api/types/case-file-catalogue'
import { Route as EditorRoute } from './_editor/index'

function findField(catalogue: CatalogueResource, id: string) {
  for (const group of catalogue.groups) {
    const field = group.fields.find((f) => f.id === id)
    if (field) return { group, field }
  }
  return null
}

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file/field/$fieldId'
)({
  loader: async ({ params }) => {
    const catalogue = await queryClient.ensureQueryData(
      getCatalogueQuery(params.animalTypeId)
    )
    const found = findField(catalogue, params.fieldId)
    if (!found) throw notFound()
    return { breadcrumb: found.field.label.slice(0, 40) }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId, fieldId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))
  const found = findField(catalogue, fieldId)

  // Gone after a concurrent change; the editor shows the current state.
  if (!found) return null

  return (
    <FieldDefinitionPage
      key={found.field.id}
      catalogue={catalogue}
      groupId={found.group.id}
      field={found.field}
      onDone={() => navigate({ params: { animalTypeId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
