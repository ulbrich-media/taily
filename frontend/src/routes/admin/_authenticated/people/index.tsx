import {
  createFileRoute,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon } from 'lucide-react'
import { PersonListPage } from '@/admin/module/people/pages/PersonListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listPeoplePageQuery } from '@/admin/module/people/api/queries'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import {
  personListSearchDefaults,
  personListSearchSchema,
  toPersonListParams,
  type PersonListSearch,
} from '@/admin/module/people/person-list.search'
import { applyListChange } from '@/components/list/list-search'
import {
  rememberListSearch,
  searchToRestore,
} from '@/components/list/remembered-list-search'
import { Button } from '@/shadcn/components/ui/button'
import type { PersonListResource } from '@/api/types/people'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/people/create'
import { Route as PersonDetailRoute } from '@/routes/admin/_authenticated/people/$id/index'

const REMEMBER_KEY = 'people'

export const Route = createFileRoute('/admin/_authenticated/people/')({
  validateSearch: personListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(personListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // filters of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: personListSearchDefaults,
      key: REMEMBER_KEY,
      schema: personListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
  },
  // `view` is presentation only and must not trigger a reload.
  loaderDeps: ({ search }) => toPersonListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing filters, sort or page on the open list must not hold the
    // navigation back: the page keeps showing the previous result and says
    // that it is updating. Only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listPeoplePageQuery(deps))
      return
    }

    await Promise.all([
      queryClient.ensureQueryData(listPeoplePageQuery(deps)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
      queryClient.ensureQueryData(listOrganizationsQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  // Includes reset states, so clearing the filters is remembered as well.
  // Saved again on leaving, so the time counts from the last visit.
  useEffect(() => {
    rememberListSearch(REMEMBER_KEY, search)
    return () => rememberListSearch(REMEMBER_KEY, search)
  }, [search])

  const { data: people, isPlaceholderData } = useQuery({
    ...listPeoplePageQuery(toPersonListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })
  const { data: organizations = [] } = useQuery(listOrganizationsQuery)
  const { data: animalTypes } = useQuery(listAnimalTypesQuery)

  // A page past the end (old link, rows gone meanwhile) shows nothing useful:
  // go to the last page that exists instead.
  const lastPage = people?.meta.last_page
  const pastTheEnd =
    people !== undefined &&
    people.meta.total > 0 &&
    people.meta.current_page > people.meta.last_page
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
  if (!people) return null

  const handleSearchChange = (patch: Partial<PersonListSearch>) => {
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
        <PlusIcon />
        Person hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (person: PersonListResource) => (
    <Button size="sm" variant="outline" asChild>
      <PersonDetailRoute.Link params={{ id: person.id }}>
        <Edit /> Bearbeiten
      </PersonDetailRoute.Link>
    </Button>
  )

  return (
    <PersonListPage
      people={people}
      search={search}
      organizations={organizations}
      animalTypes={animalTypes?.data ?? []}
      isUpdating={isPlaceholderData}
      onSearchChange={handleSearchChange}
      createAction={createAction}
      renderRowActions={renderRowActions}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
