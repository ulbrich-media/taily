import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { AdoptionListPage } from '@/admin/module/adoptions/pages/AdoptionListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listAdoptionsPageQuery } from '@/admin/module/adoptions/api/queries'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { listPeopleQuery } from '@/admin/module/people/api/queries'
import {
  adoptionListSearchDefaults,
  adoptionListSearchSchema,
  toAdoptionListParams,
  type AdoptionListSearch,
} from '@/admin/module/adoptions/adoption-list.search'
import { applyListChange } from '@/components/list/list-search'
import { Button } from '@/shadcn/components/ui/button'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/adoptions/_list/create'
import { Route as DetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import type { AdoptionListResource } from '@/api/types/adoptions'

export const Route = createFileRoute('/admin/_authenticated/adoptions/_list')({
  validateSearch: adoptionListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(adoptionListSearchDefaults)],
  },
  // `view` is presentation only and must not trigger a reload.
  loaderDeps: ({ search }) => toAdoptionListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing filters, sort or page on the open list must not hold the
    // navigation back: the page keeps showing the previous result and says
    // that it is updating. Only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listAdoptionsPageQuery(deps))
      return
    }

    await Promise.all([
      queryClient.ensureQueryData(listAdoptionsPageQuery(deps)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(listPeopleQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: adoptions, isPlaceholderData } = useQuery({
    ...listAdoptionsPageQuery(toAdoptionListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })
  const { data: people } = useQuery(listPeopleQuery)
  const { data: animalTypes } = useQuery(listAnimalTypesQuery)

  // The loader fills the cache before this renders.
  if (!adoptions) return null

  const mediators = (people ?? []).filter(
    (person) => person.mediator_animal_types?.length > 0
  )

  const handleSearchChange = (patch: Partial<AdoptionListSearch>) => {
    navigate({
      to: '.',
      search: applyListChange(search, patch),
      // Filtering is refinement of one view, not a history of its own.
      replace: true,
      // The list decides itself whether and where to scroll.
      resetScroll: false,
    })
  }

  const createAction = (
    <Button asChild>
      <CreateRoute.Link>
        <Plus />
        Vermittlung hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderDetailLink = (adoption: AdoptionListResource) => (
    <DetailRoute.Link params={{ adoptionId: adoption.id }}>
      Öffnen
    </DetailRoute.Link>
  )

  return (
    <>
      <AdoptionListPage
        adoptions={adoptions}
        search={search}
        mediators={mediators}
        animalTypes={animalTypes?.data ?? []}
        isUpdating={isPlaceholderData}
        onSearchChange={handleSearchChange}
        createAction={createAction}
        renderDetailLink={renderDetailLink}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      />
      <Outlet />
    </>
  )
}
