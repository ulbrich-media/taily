import { createFileRoute } from '@tanstack/react-router'
import { AdoptionCreatePage } from '@/admin/module/adoptions/pages/AdoptionCreatePage.tsx'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalsQuery } from '@/admin/module/animals/api/queries.ts'
import { listPeopleFilteredQuery } from '@/admin/module/people/api/queries.ts'
import { listPersonsQuery } from '@/lib/api/persons'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import { Route as AdoptionsListRoute } from '@/routes/admin/_authenticated/adoptions/_list/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/_list/create'
)({
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(listAnimalsQuery()),
      queryClient.ensureQueryData(listPersonsQuery),
      queryClient.ensureQueryData(
        listPeopleFilteredQuery({
          role: 'mediator',
        })
      ),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToAdoptionDetail = AdoptionDetailRoute.useNavigate()
  const navigateToAdoptionsList = AdoptionsListRoute.useNavigate()
  const { data: animals } = useSuspenseQuery(listAnimalsQuery())
  const { data: persons } = useSuspenseQuery(listPersonsQuery)
  const { data: mediators } = useSuspenseQuery(
    listPeopleFilteredQuery({ role: 'mediator' })
  )

  const handleCreated = (id: string) => {
    navigateToAdoptionDetail({ params: { adoptionId: id } })
  }

  const handleClose = () => {
    navigateToAdoptionsList({})
  }

  return (
    <AdoptionCreatePage
      animals={animals}
      persons={persons}
      mediators={mediators}
      onCreated={handleCreated}
      onClose={handleClose}
    />
  )
}
