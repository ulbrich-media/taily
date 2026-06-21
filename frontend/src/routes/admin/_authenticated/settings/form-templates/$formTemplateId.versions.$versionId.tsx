import { createFileRoute, notFound } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { formTemplateQuery } from '@/admin/module/form-templates/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import { Route as EditRoute } from './$formTemplateId.edit'
import { FormTemplateVersionDetail } from '@/admin/module/form-templates/components/FormTemplateVersionDetail'
import { formatApiDate } from '@/lib/dates.utils'
import { Card, CardBox, CardContent } from '@/shadcn/components/ui/card.tsx'
import { InfoRow } from '@/shadcn/components/common/info-row.tsx'
import { NavMenu, NavMenuItem } from '@/shadcn/components/ui/nav-menu.tsx'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/$formTemplateId/versions/$versionId'
)({
  loader: async ({ params }) => {
    const response = await queryClient.ensureQueryData(
      formTemplateQuery(params.formTemplateId)
    )
    if (!response) throw notFound()
    const version = response.data.versions?.find(
      (v) => v.id === params.versionId
    )
    if (!version) throw notFound()

    return {
      breadcrumb: `Version ${version.version}`,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { formTemplateId, versionId } = Route.useParams()
  const { data } = useSuspenseQuery(formTemplateQuery(formTemplateId))
  const template = data.data
  const sortedVersions = [...(template.versions ?? [])].sort(
    (a, b) => b.version - a.version
  )
  const version = sortedVersions.find((v) => v.id === versionId)

  if (!version) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title={template.name}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        actions={
          <Button asChild>
            <EditRoute.Link params={{ formTemplateId }}>
              Bearbeiten
            </EditRoute.Link>
          </Button>
        }
      />

      <Card>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoRow label="Versionen">{sortedVersions.length}</InfoRow>
            <InfoRow label="Einreichungen">
              {data.data.submissions_count}
            </InfoRow>
            <InfoRow label="Erstellt">
              {formatApiDate(template.created_at)}
            </InfoRow>
            <InfoRow label="Aktualisiert">
              {formatApiDate(template.updated_at)}
            </InfoRow>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <CardBox className="p-3">
          <NavMenu>
            {sortedVersions.map((v) => (
              <NavMenuItem key={v.id} asChild>
                <Route.Link
                  params={{ formTemplateId, versionId: v.id }}
                  activeOptions={{ exact: true }}
                  className="flex items-start justify-between"
                >
                  <div>
                    Version {v.version}
                    <br />
                    <span className="text-muted-foreground text-sm">
                      {/*{v.submissions_count} Einreichungen*/}
                      {formatApiDate(v.updated_at)}
                    </span>
                  </div>
                  {sortedVersions.length === v.version && (
                    <div>
                      <Badge variant="default" className="text-xs">
                        Aktiv
                      </Badge>
                    </div>
                  )}
                </Route.Link>
              </NavMenuItem>
            ))}
          </NavMenu>
        </CardBox>

        <FormTemplateVersionDetail version={version} />
      </div>
    </div>
  )
}
