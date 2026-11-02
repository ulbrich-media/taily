import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Edit, Plus } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Button } from '@/shadcn/components/ui/button'
import { listContractTemplatesQuery } from '@/admin/module/contract-templates/api/queries'
import { ContractTemplateListPage } from '@/admin/module/contract-templates/pages/ContractTemplateListPage'
import { Route as NewRoute } from '../new'
import { Route as EditRoute } from '../$templateId'
import { Route as ArchiveRoute } from './$templateId.archive'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/contracts/_list'
)({
  loader: () => queryClient.ensureQueryData(listContractTemplatesQuery()),
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { data: templates } = useSuspenseQuery(listContractTemplatesQuery())

  return (
    <>
      <ContractTemplateListPage
        templates={templates}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        createAction={
          <Button asChild>
            <NewRoute.Link>
              <Plus />
              Vorlage anlegen
            </NewRoute.Link>
          </Button>
        }
        renderActions={(template) => (
          <>
            <Button size="icon-sm" variant="ghost" asChild>
              <EditRoute.Link
                params={{ templateId: template.id }}
                aria-label={`${template.name} bearbeiten`}
              >
                <Edit />
              </EditRoute.Link>
            </Button>
            <Button size="icon-sm" variant="ghost" asChild>
              <ArchiveRoute.Link
                params={{ templateId: template.id }}
                aria-label={`${template.name} ${template.archived_at ? 'wiederherstellen' : 'archivieren'}`}
              >
                {template.archived_at ? <ArchiveRestore /> : <Archive />}
              </ArchiveRoute.Link>
            </Button>
          </>
        )}
      />
      <Outlet />
    </>
  )
}
