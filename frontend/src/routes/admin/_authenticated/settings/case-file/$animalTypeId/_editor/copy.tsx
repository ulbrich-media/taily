import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'
import { CatalogueCopyDialog } from '@/admin/module/case-file-catalogue/pages/CatalogueCopyDialog'
import { Route as EditorRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/case-file/$animalTypeId/_editor/copy'
)({
  staticData: { breadcrumb: 'Kopieren', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { animalTypeId } = Route.useParams()
  const navigate = EditorRoute.useNavigate()
  const { data: catalogue } = useSuspenseQuery(getCatalogueQuery(animalTypeId))
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)

  return (
    <CatalogueCopyDialog
      animalType={catalogue.animal_type}
      animalTypes={animalTypes.data}
      onClose={() => navigate({ params: { animalTypeId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
