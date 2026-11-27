import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { listContractTemplatesQuery } from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateArchiveDialog } from '@/admin/module/contract-templates/pages/ContractTemplateArchiveDialog'
import { Route as ListRoute } from './index'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/contracts/_list/$templateId/archive'
)({
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async ({ params }) => {
    const templates = await queryClient.ensureQueryData(
      listContractTemplatesQuery(params.animalTypeId)
    )
    if (!templates.some((t) => t.id === params.templateId)) throw notFound()
  },
  staticData: { breadcrumb: 'Archivieren', dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const { animalTypeId, templateId } = Route.useParams()
  const navigate = ListRoute.useNavigate()
  const { data: templates } = useSuspenseQuery(
    listContractTemplatesQuery(animalTypeId)
  )
  const template = templates.find((t) => t.id === templateId)

  // Gone after a concurrent change; the list shows the current state.
  if (!template) return null

  return (
    <ContractTemplateArchiveDialog
      template={template}
      onClose={() => navigate({})}
    />
  )
}
