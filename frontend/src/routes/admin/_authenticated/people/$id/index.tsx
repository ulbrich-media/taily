import { createFileRoute } from '@tanstack/react-router'
import { PersonEditBasicPage } from '@/admin/module/people/pages/PersonEditBasicPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { customFieldDefinitionsQuery } from '@/admin/module/custom-fields/api/queries'
import { queryClient } from '@/lib/queryClient.ts'

export const Route = createFileRoute('/admin/_authenticated/people/$id/')({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(
      customFieldDefinitionsQuery({ entity: 'person', record_id: params.id })
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))
  const { data: customFieldGroups } = useSuspenseQuery(
    customFieldDefinitionsQuery({ entity: 'person', record_id: id })
  )

  return (
    <PersonEditBasicPage
      person={person}
      customFieldGroups={customFieldGroups}
    />
  )
}
