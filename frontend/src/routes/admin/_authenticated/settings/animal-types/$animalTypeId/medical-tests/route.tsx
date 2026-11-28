import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { MedicalTestListPage } from '@/admin/module/medical-tests/pages/MedicalTestListPage'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsPageQuery } from '@/admin/module/medical-tests/api/queries'
import {
  animalTypeItemListSearchDefaults,
  animalTypeItemListSearchSchema,
  toAnimalTypeItemListParams,
  type AnimalTypeItemListSearch,
} from '@/admin/module/animal-types/animal-type-item-list.search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { MedicalTestResource } from '@/api/types/medical-tests'
import { Route as CreateRoute } from './create'
import { Route as EditRoute } from './$id.edit'
import { Route as DeleteRoute } from './$id.delete'

/** The animal type comes from the URL, so it is not a filter of the list. */
const scopedParams = (search: AnimalTypeItemListSearch, animalTypeId: string) =>
  toAnimalTypeItemListParams({ ...search, animal_type_id: animalTypeId })

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/medical-tests'
)({
  staticData: { breadcrumb: 'Tests' },
  validateSearch: animalTypeItemListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(animalTypeItemListSearchDefaults)],
  },
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps, params, cause }) => {
    const query = listMedicalTestsPageQuery(
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

  const { data: medicalTests, isPlaceholderData } = useQuery({
    ...listMedicalTestsPageQuery(scopedParams(search, animalTypeId)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: medicalTests,
  })

  // The loader fills the cache before this renders.
  if (!medicalTests) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link params={{ animalTypeId }} search>
        <PlusIcon />
        Test hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (medicalTest: MedicalTestResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link
              params={{ animalTypeId, id: medicalTest.id }}
              search
            >
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="icon-sm" variant="destructive_outline" asChild>
            <DeleteRoute.Link
              params={{ animalTypeId, id: medicalTest.id }}
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
      <MedicalTestListPage
        medicalTests={medicalTests}
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
