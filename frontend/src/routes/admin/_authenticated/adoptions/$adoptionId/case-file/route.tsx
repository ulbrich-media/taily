import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Edit, SlidersHorizontal } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/shadcn/components/ui/button'
import { getCaseFileQuery } from '@/admin/module/case-file/api/queries'
import { CaseFileView } from '@/admin/module/case-file/components/CaseFileView'
import { isEditable } from '@/admin/module/case-file/case-file.utils'
import { Route as GroupRoute } from './group.$groupId'
import { Route as RequirementRoute } from './requirement.$fieldKey'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/case-file'
)({
  loader: ({ params }) =>
    queryClient.ensureQueryData(getCaseFileQuery(params.adoptionId)),
  staticData: { breadcrumb: 'Angaben' },
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const { data: caseFile } = useSuspenseQuery(getCaseFileQuery(adoptionId))

  return (
    <>
      <CaseFileView
        caseFile={caseFile}
        renderEditGroupAction={(group) =>
          group.fields.some(isEditable) ? (
            <Button size="sm" variant="outline" asChild>
              <GroupRoute.Link params={{ adoptionId, groupId: group.id }}>
                <Edit />
                Bearbeiten
              </GroupRoute.Link>
            </Button>
          ) : null
        }
        renderRequirementAction={(field) => (
          <Button
            size="icon-sm"
            variant="ghost"
            asChild
            className="size-6 text-muted-foreground"
          >
            <RequirementRoute.Link
              params={{ adoptionId, fieldKey: field.key }}
              title="Anforderung für diese Vermittlung anpassen"
            >
              <SlidersHorizontal className="size-3.5" />
              <span className="sr-only">
                Anforderung für {field.label} anpassen
              </span>
            </RequirementRoute.Link>
          </Button>
        )}
      />
      <Outlet />
    </>
  )
}
