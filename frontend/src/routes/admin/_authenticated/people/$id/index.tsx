import { createFileRoute } from '@tanstack/react-router'
import { PersonEditBasicPage } from '@/admin/module/people/pages/PersonEditBasicPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'

export const Route = createFileRoute('/admin/_authenticated/people/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))

  return <PersonEditBasicPage person={person} />
}
