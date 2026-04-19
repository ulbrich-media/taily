import { createFileRoute } from '@tanstack/react-router'
import { PersonListPage } from '@/admin/module/people/pages/PersonListPage'
import { queryClient } from '@/lib/queryClient'
import { listPeopleQuery } from '@/admin/module/people/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, PlusIcon } from 'lucide-react'
import type { PersonListResource } from '@/api/types/people'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/people/create'
import { Route as PersonDetailRoute } from '@/routes/admin/_authenticated/people/$id/index'

export const Route = createFileRoute('/admin/_authenticated/people/')({
  loader: async () => {
    await queryClient.ensureQueryData(listPeopleQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { data: people } = useSuspenseQuery(listPeopleQuery)

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <PlusIcon />
        Person hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (person: PersonListResource) => (
    <Button size="sm" variant="outline" asChild>
      <PersonDetailRoute.Link params={{ id: person.id }}>
        <Edit /> Bearbeiten
      </PersonDetailRoute.Link>
    </Button>
  )

  return (
    <PersonListPage
      people={people}
      createAction={createAction}
      renderRowActions={renderRowActions}
    />
  )
}
