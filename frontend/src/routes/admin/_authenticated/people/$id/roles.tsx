import { createFileRoute } from '@tanstack/react-router'
import { PersonEditRolesPage } from '@/admin/module/people/pages/PersonEditRolesPage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/health-conditions/api/queries.ts'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/admin/_authenticated/people/$id/roles')({
  loader: async ({ params }) => {
    await Promise.all([
      queryClient.ensureQueryData(getPersonQuery(params.id)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))
  const { data: animalTypesData } = useSuspenseQuery(listAnimalTypesQuery)

  return (
    <PersonEditRolesPage person={person} animalTypes={animalTypesData.data} />
  )
}
