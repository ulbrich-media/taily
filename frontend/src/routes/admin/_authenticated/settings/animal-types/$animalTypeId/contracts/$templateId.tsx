import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth.hook'
import {
  getContractFieldOptionsQuery,
  getContractTemplateQuery,
} from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateFormPage } from '@/admin/module/contract-templates/pages/ContractTemplateFormPage'
import { Route as ListRoute } from './_list/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/contracts/$templateId'
)({
  loader: async ({ params }) => {
    const [template] = await Promise.all([
      queryClient.ensureQueryData(getContractTemplateQuery(params.templateId)),
      queryClient.fetchQuery(getContractFieldOptionsQuery()),
    ])
    // A template belongs to exactly one animal type.
    if (template.animal_type.id !== params.animalTypeId) throw notFound()
    return { breadcrumb: template.name }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { animalTypeId, templateId } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: template } = useSuspenseQuery(
    getContractTemplateQuery(templateId)
  )
  const { data: options } = useSuspenseQuery(getContractFieldOptionsQuery())

  return (
    <ContractTemplateFormPage
      key={template.id}
      template={template}
      animalTypeId={animalTypeId}
      options={options}
      onDone={() => navigate({})}
      readOnly={!isAdmin}
    />
  )
}
