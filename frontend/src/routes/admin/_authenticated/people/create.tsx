import { createFileRoute } from '@tanstack/react-router'
import { PersonCreatePage } from '@/admin/module/people/pages/PersonCreatePage'
import { queryClient } from '@/lib/queryClient'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { Route as PeopleListRoute } from '@/routes/admin/_authenticated/people/index'
import { Route as PersonDetailRoute } from '@/routes/admin/_authenticated/people/$id/index'
import { useSuspenseQuery } from '@tanstack/react-query'
import { customFieldDefinitionsQuery } from '@/admin/module/custom-fields/api/queries'

export const Route = createFileRoute('/admin/_authenticated/people/create')({
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(listOrganizationsQuery),
      queryClient.ensureQueryData(
        customFieldDefinitionsQuery({ entity: 'person' })
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToList = PeopleListRoute.useNavigate()
  const navigateToDetail = PersonDetailRoute.useNavigate()
  const { data: customFieldGroups } = useSuspenseQuery(
    customFieldDefinitionsQuery({ entity: 'person' })
  )

  const handleCreated = (id: string) => {
    navigateToDetail({ params: { id } })
  }

  const handleCancel = () => {
    navigateToList({})
  }

  return (
    <PersonCreatePage
      customFieldGroups={customFieldGroups}
      onCreated={handleCreated}
      onCancel={handleCancel}
    />
  )
}
