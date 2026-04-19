import { createFileRoute } from '@tanstack/react-router'
import { PersonCreatePage } from '@/admin/module/people/pages/PersonCreatePage'
import { queryClient } from '@/lib/queryClient'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { Route as PeopleListRoute } from '@/routes/admin/_authenticated/people/index'
import { Route as PersonDetailRoute } from '@/routes/admin/_authenticated/people/$id/index'

export const Route = createFileRoute('/admin/_authenticated/people/create')({
  loader: async () => {
    await queryClient.ensureQueryData(listOrganizationsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToList = PeopleListRoute.useNavigate()
  const navigateToDetail = PersonDetailRoute.useNavigate()

  const handleCreated = (id: string) => {
    navigateToDetail({ params: { id } })
  }

  const handleCancel = () => {
    navigateToList({})
  }

  return <PersonCreatePage onCreated={handleCreated} onCancel={handleCancel} />
}
