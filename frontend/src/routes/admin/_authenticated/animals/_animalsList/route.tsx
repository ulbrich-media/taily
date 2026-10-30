import {
  createFileRoute,
  Outlet,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { AnimalListPage } from '@/admin/module/animals/pages/AnimalListPage.tsx'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries.ts'
import { listAnimalsPageQuery } from '@/admin/module/animals/api/queries.ts'
import { listPeopleFilteredQuery } from '@/admin/module/people/api/queries.ts'
import {
  animalListSearchDefaults,
  animalListSearchSchema,
  toAnimalListParams,
  type AnimalListSearch,
} from '@/admin/module/animals/animal-list.search'
import { applyListChange } from '@/components/list/list-search'
import {
  rememberListSearch,
  searchToRestore,
} from '@/components/list/remembered-list-search'
import { Button } from '@/shadcn/components/ui/button.tsx'
import type { AnimalListResource } from '@/api/types/animals'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/animals/create'
import { Route as AnimalDetailRoute } from '@/routes/admin/_authenticated/animals/_animalDetail/$animalTypeId.animal.$animalId/route'

// Only the people who can be filtered by, not the whole directory.
const mediatorsQuery = listPeopleFilteredQuery({ role: 'mediator' })

const REMEMBER_KEY = 'animals'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalsList'
)({
  validateSearch: animalListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(animalListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // filters of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: animalListSearchDefaults,
      key: REMEMBER_KEY,
      schema: animalListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
  },
  loaderDeps: ({ search }) => toAnimalListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing filters, sort or page on the open list must not hold the
    // navigation back: the page keeps showing the previous result and says
    // that it is updating. Only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listAnimalsPageQuery(deps))
      return
    }

    await Promise.all([
      queryClient.ensureQueryData(listAnimalsPageQuery(deps)),
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
  // Saved again on leaving, so the time counts from the last visit.
  useEffect(() => {
    rememberListSearch(REMEMBER_KEY, search)
    return () => rememberListSearch(REMEMBER_KEY, search)
  }, [search])

  const { data: animals, isPlaceholderData } = useQuery({
    ...listAnimalsPageQuery(toAnimalListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })
  const { data: mediators = [] } = useQuery(mediatorsQuery)
  const { data: animalTypes } = useQuery(listAnimalTypesQuery)

  // A page past the end (old link, rows gone meanwhile) shows nothing useful:
  // go to the last page that exists instead.
  const lastPage = animals?.meta.last_page
  const pastTheEnd =
    animals !== undefined &&
    animals.meta.total > 0 &&
    animals.meta.current_page > animals.meta.last_page
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
  if (!animals) return null

  const handleSearchChange = (patch: Partial<AnimalListSearch>) => {
    navigate({
      to: '.',
      search: applyListChange(search, patch),
      // Filtering is refinement of one view, not a history of its own.
      replace: true,
      // The list decides itself whether and where to scroll.
      resetScroll: false,
    })
  }

  // The create form only takes the animal type; the list's other filters
  // are remembered and come back when the form is left.
  const createAction = (
    <Button asChild>
      <CreateRoute.Link
        search={
          search.animal_type_id ? { animal_type_id: search.animal_type_id } : {}
        }
      >
        <Plus />
        Tier hinzufügen
      </CreateRoute.Link>
    </Button>
  )

  const renderRowActions = (animal: AnimalListResource) => (
    <Button size="sm" variant="outline" asChild>
      <AnimalDetailRoute.Link
        params={{ animalTypeId: animal.animal_type_id, animalId: animal.id }}
      >
        <Pencil /> Bearbeiten
      </AnimalDetailRoute.Link>
    </Button>
  )

  return (
    <>
      <AnimalListPage
        animals={animals}
        search={search}
        mediators={mediators}
        animalTypes={animalTypes?.data ?? []}
        isUpdating={isPlaceholderData}
        onSearchChange={handleSearchChange}
        createAction={createAction}
        renderRowActions={renderRowActions}
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      />
      <Outlet />
    </>
  )
}
