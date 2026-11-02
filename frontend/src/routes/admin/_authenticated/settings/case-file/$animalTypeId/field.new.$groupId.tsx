import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { FieldDefinitionPage } from '@/admin/module/case-file-catalogue/pages/FieldDefinitionPage'
import { Route as EditorRoute } from './_editor/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/case-file/$animalTypeId/field/new/$groupId'
)({
  loader: async ({ params }) => {
    const catalogue = await queryClient.ensureQueryData(
      getCatalogueQuery(params.animalTypeId)
    )
    if (!catalogue.groups.some((g) => g.id === params.groupId)) throw notFound()
  },
  staticData: { breadcrumb: 'Neues Feld' },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId, groupId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))

  return (
    <FieldDefinitionPage
      catalogue={catalogue}
      groupId={groupId}
      onDone={() => navigate({ params: { animalTypeId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
