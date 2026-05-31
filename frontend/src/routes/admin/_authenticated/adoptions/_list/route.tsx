import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AdoptionListPage } from '@/admin/module/adoptions/pages/AdoptionListPage'
import { queryClient } from '@/lib/queryClient'
import { listAdoptionsQuery } from '@/admin/module/adoptions/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button'
import { ExternalLink, Plus } from 'lucide-react'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/adoptions/_list/create'
import { Route as DetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import type { AdoptionListResource } from '@/api/types/adoptions'

export const Route = createFileRoute('/admin/_authenticated/adoptions/_list')({
  loader: async () => {
    await queryClient.ensureQueryData(listAdoptionsQuery())
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: adoptions } = useSuspenseQuery(listAdoptionsQuery())

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <Plus />
        Vermittlung hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderDetailLink = (adoption: AdoptionListResource) => (
    <DetailRoute.Link params={{ adoptionId: adoption.id }}>
      <ExternalLink className="size-4" />
      Öffnen
    </DetailRoute.Link>
  )

  return (
    <>
      <AdoptionListPage
        adoptions={adoptions}
        createAction={createAction}
        renderDetailLink={renderDetailLink}
      />
      <Outlet />
    </>
  )
}
