import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { getContractFieldOptionsQuery } from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateFormPage } from '@/admin/module/contract-templates/pages/ContractTemplateFormPage'
import { Route as ListRoute } from './_list/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/contracts/new'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: () => queryClient.fetchQuery(getContractFieldOptionsQuery()),
  staticData: { breadcrumb: 'Neue Vorlage' },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: options } = useSuspenseQuery(getContractFieldOptionsQuery())

  return (
    <ContractTemplateFormPage
      animalTypeId={animalTypeId}
      options={options}
      onDone={() => navigate({})}
    />
  )
}
