import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { queryClient } from '@/lib/queryClient'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Button } from '@/shadcn/components/ui/button'
import { listCustomFieldGroupsQuery } from '@/admin/module/custom-fields/api/queries'
import { CustomFieldGroupListPage } from '@/admin/module/custom-fields/pages/CustomFieldGroupListPage'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/custom-field-groups/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/custom-field-groups/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/custom-field-groups/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/custom-field-groups'
)({
  staticData: { breadcrumb: 'Zusatzfelder' },
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  loader: async () => {
    await queryClient.ensureQueryData(listCustomFieldGroupsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { data } = useSuspenseQuery(listCustomFieldGroupsQuery)

  return (
    <>
      <CustomFieldGroupListPage
        groups={data.data}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        createAction={
          <Button asChild>
            <CreateRoute.Link>
              <PlusIcon />
              Zusatzfelder hinzufügen
            </CreateRoute.Link>
          </Button>
        }
        renderRowActions={(group) => (
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" asChild>
              <EditRoute.Link params={{ id: group.id }}>
                <Edit /> Bearbeiten
              </EditRoute.Link>
            </Button>
            <Button size="icon-sm" variant="destructive_outline" asChild>
              <DeleteRoute.Link
                params={{ id: group.id }}
                aria-label="Löschen"
                title="Löschen"
              >
                <Trash2 />
              </DeleteRoute.Link>
            </Button>
          </div>
        )}
      />
      <Outlet />
    </>
  )
}
