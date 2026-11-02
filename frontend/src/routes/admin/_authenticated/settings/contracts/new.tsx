import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { getContractFieldOptionsQuery } from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateFormPage } from '@/admin/module/contract-templates/pages/ContractTemplateFormPage'
import { Route as ListRoute } from './_list/index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/contracts/new'
)({
  loader: () =>
    Promise.all([
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.fetchQuery(getContractFieldOptionsQuery()),
    ]),
  staticData: { breadcrumb: 'Neue Vorlage' },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = ListRoute.useNavigate()
  const { data: animalTypes } = useSuspenseQuery(listAnimalTypesQuery)
  const { data: options } = useSuspenseQuery(getContractFieldOptionsQuery())

  return (
    <ContractTemplateFormPage
      animalTypes={[...animalTypes.data].sort((a, b) =>
        a.title.localeCompare(b.title)
      )}
      options={options}
      onDone={() => navigate({})}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
