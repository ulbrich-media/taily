import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { getCaseFileQuery } from '@/admin/module/case-file/api/queries'
import { RequirementEditDialog } from '@/admin/module/case-file/pages/RequirementEditDialog'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import type { CaseFileResource } from '@/api/types/case-file'

function findField(caseFile: CaseFileResource, key: string) {
  return caseFile.groups
    .flatMap((group) => group.fields)
    .find((field) => field.key === key)
}

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/requirement/$fieldKey'
)({
  loader: async ({ params }) => {
    const caseFile = await queryClient.ensureQueryData(
      getCaseFileQuery(params.adoptionId)
    )
    const field = findField(caseFile, params.fieldKey)

    if (!field) {
      throw notFound()
    }

    return { breadcrumb: `Anforderung: ${field.label}` }
  },
  staticData: { dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId, fieldKey } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: caseFile } = useSuspenseQuery(getCaseFileQuery(adoptionId))
  const field = findField(caseFile, fieldKey)!

  return (
    <RequirementEditDialog
      adoptionId={adoptionId}
      field={field}
      onClose={() => navigate({ params: { adoptionId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
