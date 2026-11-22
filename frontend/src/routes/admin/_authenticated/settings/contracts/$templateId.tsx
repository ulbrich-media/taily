import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth.hook'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import {
  getContractFieldOptionsQuery,
  getContractTemplateQuery,
} from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateFormPage } from '@/admin/module/contract-templates/pages/ContractTemplateFormPage'
import { Route as ListRoute } from './_list/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/contracts/$templateId'
)({
  loader: async ({ params }) => {
    const [template] = await Promise.all([
      queryClient.ensureQueryData(getContractTemplateQuery(params.templateId)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.fetchQuery(getContractFieldOptionsQuery()),
    ])
    return { breadcrumb: template.name }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const { templateId } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: template } = useSuspenseQuery(
    getContractTemplateQuery(templateId)
  )
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)
  const { data: options } = useSuspenseQuery(getContractFieldOptionsQuery())

  return (
    <ContractTemplateFormPage
      key={template.id}
      template={template}
      animalTypes={[...animalTypes.data].sort((a, b) =>
        a.title.localeCompare(b.title)
      )}
      options={options}
      onDone={() => navigate({})}
      readOnly={!isAdmin}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
