import { createFileRoute } from '@tanstack/react-router'
import { PersonDeletePage } from '@/admin/module/people/pages/PersonDeletePage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as PeopleListRoute } from '@/routes/admin/_authenticated/people/index'
import { Route as PersonDetailRoute } from '@/routes/admin/_authenticated/people/$id/index'

export const Route = createFileRoute('/admin/_authenticated/people/$id/delete')(
  {
    loader: async ({ params }) => {
      await queryClient.ensureQueryData(getPersonQuery(params.id))
    },
    component: RouteComponent,
  }
)

function RouteComponent() {
  const { id } = Route.useParams()
  const navigateToPeopleList = PeopleListRoute.useNavigate()
  const navigateToPersonDetail = PersonDetailRoute.useNavigate()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))

  const handleDeleted = () => {
    navigateToPeopleList({})
  }

  const handleClose = () => {
    navigateToPersonDetail({ params: { id } })
  }

  return (
    <PersonDeletePage
      person={person}
      onDeleted={handleDeleted}
      onClose={handleClose}
    />
  )
}
