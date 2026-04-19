import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ApiTokenListPage } from '@/admin/module/api-tokens/pages/ApiTokenListPage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listApiTokensQuery } from '@/admin/module/api-tokens/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button'
import { PlusIcon, Trash2 } from 'lucide-react'
import type { ApiTokenResource } from '@/api/types/api-tokens'
import { formatApiDateTime } from '@/lib/dates.utils.ts'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/create'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/api-tokens'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listApiTokensQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: tokens } = useSuspenseQuery(listApiTokensQuery)

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        API Token hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (token: ApiTokenResource) => (
    <Button size="sm" variant="destructive" asChild>
      <DeleteRoute.Link params={{ id: `${token.id}` }}>
        <Trash2 /> Löschen
      </DeleteRoute.Link>
    </Button>
  )

  return (
    <>
      <ApiTokenListPage
        tokens={tokens.data}
        createAction={createAction}
        renderRowActions={renderRowActions}
        formatDateTime={formatApiDateTime}
      />
      <Outlet />
    </>
  )
}
