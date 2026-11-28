import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { VaccinationListPage } from '@/admin/module/vaccinations/pages/VaccinationListPage'
import { queryClient } from '@/lib/queryClient.ts'
import { listVaccinationsPageQuery } from '@/admin/module/vaccinations/api/queries'
import {
  animalTypeItemListSearchDefaults,
  animalTypeItemListSearchSchema,
  toAnimalTypeItemListParams,
  type AnimalTypeItemListSearch,
} from '@/admin/module/animal-types/animal-type-item-list.search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { VaccinationResource } from '@/api/types/vaccinations'
import { Route as CreateRoute } from './create'
import { Route as EditRoute } from './$id.edit'
import { Route as DeleteRoute } from './$id.delete'

/** The animal type comes from the URL, so it is not a filter of the list. */
const scopedParams = (search: AnimalTypeItemListSearch, animalTypeId: string) =>
  toAnimalTypeItemListParams({ ...search, animal_type_id: animalTypeId })

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/vaccinations'
)({
  staticData: { breadcrumb: 'Impfungen' },
  validateSearch: animalTypeItemListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(animalTypeItemListSearchDefaults)],
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps, params, cause }) => {
    const query = listVaccinationsPageQuery(
      scopedParams(deps.search, params.animalTypeId)
    )

    // Changing the page on the open list must not hold the navigation back;
    // only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(query)
      return
    }

    await queryClient.ensureQueryData(query)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { animalTypeId } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: vaccinations, isPlaceholderData } = useQuery({
    ...listVaccinationsPageQuery(scopedParams(search, animalTypeId)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: vaccinations,
  })

  // The loader fills the cache before this renders.
  if (!vaccinations) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link params={{ animalTypeId }} search>
        <PlusIcon />
        Impfung hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (vaccination: VaccinationResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link
              params={{ animalTypeId, id: vaccination.id }}
              search
            >
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="icon-sm" variant="destructive_outline" asChild>
            <DeleteRoute.Link
              params={{ animalTypeId, id: vaccination.id }}
              search
              aria-label="Löschen"
              title="Löschen"
            >
              <Trash2 />
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <VaccinationListPage
        vaccinations={vaccinations}
        search={{ ...search, animal_type_id: undefined }}
        isUpdating={isPlaceholderData}
        onSearchChange={handleSearchChange}
        createAction={createAction}
        renderRowActions={renderRowActions}
      />
      <Outlet />
    </>
  )
}
