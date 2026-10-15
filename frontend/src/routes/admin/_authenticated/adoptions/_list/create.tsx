import { createFileRoute } from '@tanstack/react-router'
import { AdoptionCreatePage } from '@/admin/module/adoptions/pages/AdoptionCreatePage.tsx'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import {
  listPeopleQuery,
  listPeopleFilteredQuery,
} from '@/admin/module/people/api/queries.ts'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Route as AdoptionDetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/adoption/route'
import { Route as AdoptionsListRoute } from '@/routes/admin/_authenticated/adoptions/_list/route'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/_list/create'
)({
  loader: async () => {
    await Promise.all([
      queryClient.ensureQueryData(listPeopleQuery),
      queryClient.ensureQueryData(
        listPeopleFilteredQuery({
          role: 'mediator',
        })
      ),
    ])
  },
  component: RouteComponent,
  staticData: {
    breadcrumb: 'Neue Vermittlung',
    dialog: true,
  },
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigateToAdoptionDetail = AdoptionDetailRoute.useNavigate()
  const navigateToAdoptionsList = AdoptionsListRoute.useNavigate()
  const { data: persons } = useSuspenseQuery(listPeopleQuery)
  const { data: mediators } = useSuspenseQuery(
    listPeopleFilteredQuery({ role: 'mediator' })
  )

  const handleCreated = (id: string) => {
    navigateToAdoptionDetail({ params: { adoptionId: id } })
  }

  const handleClose = () => {
    navigateToAdoptionsList({ search: true })
  }

  return (
    <AdoptionCreatePage
      persons={persons}
      mediators={mediators}
      onCreated={handleCreated}
      onClose={handleClose}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
    />
  )
}
