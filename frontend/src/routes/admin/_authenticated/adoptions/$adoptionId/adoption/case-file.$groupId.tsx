import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { getCaseFileQuery } from '@/admin/module/case-file/api/queries'
import { CaseFileGroupEditDialog } from '@/admin/module/case-file/pages/CaseFileGroupEditDialog'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/case-file/$groupId'
)({
  loader: async ({ params }) => {
    const caseFile = await queryClient.ensureQueryData(
      getCaseFileQuery(params.adoptionId)
    )
    const group = caseFile.groups.find((g) => g.id === params.groupId)

    if (!group) {
      throw notFound()
    }

    return { breadcrumb: `${group.title} bearbeiten` }
  },
  staticData: { dialog: true },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { adoptionId, groupId } = Route.useParams()
  const navigate = AdoptionDetailRoute.useNavigate()
  const { data: caseFile } = useSuspenseQuery(getCaseFileQuery(adoptionId))
  const group = caseFile.groups.find((g) => g.id === groupId)!

  return (
    <CaseFileGroupEditDialog
      adoptionId={adoptionId}
      group={group}
      allFields={caseFile.groups.flatMap((g) => g.fields)}
      onClose={() => navigate({ params: { adoptionId } })}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
