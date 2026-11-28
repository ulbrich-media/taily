import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Edit, Eye, Plus } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { listContractTemplatesQuery } from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateListPage } from '@/admin/module/contract-templates/pages/ContractTemplateListPage'
import { Route as NewRoute } from '../new'
import { Route as EditRoute } from '../$templateId'
import { Route as ArchiveRoute } from './$templateId.archive'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/contracts/_list'
)({
  loader: ({ params }) =>
    queryClient.ensureQueryData(
      listContractTemplatesQuery(params.animalTypeId)
    ),
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { animalTypeId } = Route.useParams()
  const { data: templates } = useSuspenseQuery(
    listContractTemplatesQuery(animalTypeId)
  )

  return (
    <>
      <ContractTemplateListPage
        templates={templates}
        createAction={
          isAdmin && (
            <Button asChild>
              <NewRoute.Link params={{ animalTypeId }}>
                <Plus />
                Vorlage anlegen
              </NewRoute.Link>
            </Button>
          )
        }
        renderActions={(template) => (
          <>
            <Button size="icon-sm" variant="ghost" asChild>
              <EditRoute.Link
                params={{ animalTypeId, templateId: template.id }}
                aria-label={`${template.name} ${isAdmin ? 'bearbeiten' : 'ansehen'}`}
              >
                {isAdmin ? <Edit /> : <Eye />}
              </EditRoute.Link>
            </Button>
            {isAdmin && (
              <Button size="icon-sm" variant="ghost" asChild>
                <ArchiveRoute.Link
                  params={{ animalTypeId, templateId: template.id }}
                  aria-label={`${template.name} ${template.archived_at ? 'wiederherstellen' : 'archivieren'}`}
                >
                  {template.archived_at ? <ArchiveRestore /> : <Archive />}
                </ArchiveRoute.Link>
              </Button>
            )}
          </>
        )}
      />
      <Outlet />
    </>
  )
}
