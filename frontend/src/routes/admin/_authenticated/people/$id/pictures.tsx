import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient.ts'
import { getPersonQuery } from '@/admin/module/people/api/queries.ts'
import { PersonEditPicturesPage } from '@/admin/module/people/pages/PersonEditPicturesPage.tsx'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/pictures'
)({
  loader: async ({ params }) => {
    await queryClient.ensureQueryData(getPersonQuery(params.id))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { data: person } = useSuspenseQuery(getPersonQuery(id))

  return <PersonEditPicturesPage person={person} />
}
