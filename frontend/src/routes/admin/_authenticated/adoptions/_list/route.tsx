import {
  createFileRoute,
  Outlet,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { AdoptionListPage } from '@/admin/module/adoptions/pages/AdoptionListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listAdoptionsPageQuery } from '@/admin/module/adoptions/api/queries'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { listPeopleFilteredQuery } from '@/admin/module/people/api/queries'
import {
  adoptionListSearchDefaults,
  adoptionListSearchSchema,
  toAdoptionListParams,
  type AdoptionListSearch,
} from '@/admin/module/adoptions/adoption-list.search'
import { applyListChange } from '@/components/list/list-search'
import {
  rememberListSearch,
  searchToRestore,
} from '@/components/list/remembered-list-search'
import { Button } from '@/shadcn/components/ui/button'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/adoptions/_list/create'
import { Route as DetailRoute } from '@/routes/admin/_authenticated/adoptions/$adoptionId/index'
import type { AdoptionListResource } from '@/api/types/adoptions'

// Only the people who can be filtered by, not the whole directory.
const mediatorsQuery = listPeopleFilteredQuery({ role: 'mediator' })

const REMEMBER_KEY = 'adoptions'

export const Route = createFileRoute('/admin/_authenticated/adoptions/_list')({
  validateSearch: adoptionListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(adoptionListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // filters of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: adoptionListSearchDefaults,
      key: REMEMBER_KEY,
      schema: adoptionListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
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
      queryClient.ensureQueryData(mediatorsQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Includes reset states, so clearing the filters is remembered as well.
  // Saved again on leaving, so the time counts from the last visit, not from
  // the last change.
  useEffect(() => {
    rememberListSearch(REMEMBER_KEY, search)
    return () => rememberListSearch(REMEMBER_KEY, search)
  }, [search])

  const { data: adoptions, isPlaceholderData } = useQuery({
    ...listAdoptionsPageQuery(toAdoptionListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })
  const { data: mediators = [] } = useQuery(mediatorsQuery)
  const { data: animalTypes } = useQuery(listAnimalTypesQuery)

  // A page past the end (old link, rows gone meanwhile) shows nothing useful:
  // go to the last page that exists instead.
  const lastPage = adoptions?.meta.last_page
  const pastTheEnd =
    adoptions !== undefined &&
    adoptions.meta.total > 0 &&
    adoptions.meta.current_page > adoptions.meta.last_page
  useEffect(() => {
    if (pastTheEnd && lastPage !== undefined) {
      navigate({
        to: '.',
        search: applyListChange(search, { page: lastPage }),
        replace: true,
        resetScroll: false,
      })
    }
  }, [pastTheEnd, lastPage, navigate, search])

  // The loader fills the cache before this renders.
  if (!adoptions) return null

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
      {/* The dialog opens over the list: it keeps the list's filters. */}
      <CreateRoute.Link search>
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
