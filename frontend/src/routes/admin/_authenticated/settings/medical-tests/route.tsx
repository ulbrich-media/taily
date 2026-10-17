import {
  createFileRoute,
  Outlet,
  redirect,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { MedicalTestListPage } from '@/admin/module/medical-tests/pages/MedicalTestListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listMedicalTestsPageQuery } from '@/admin/module/medical-tests/api/queries'
import { listAnimalTypesQuery } from '@/admin/module/animal-types/api/queries'
import {
  animalTypeItemListSearchDefaults,
  animalTypeItemListSearchSchema,
  toAnimalTypeItemListParams,
} from '@/admin/module/animal-types/animal-type-item-list.search'
import { searchToRestore } from '@/components/list/remembered-list-search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { MedicalTestResource } from '@/api/types/medical-tests'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/medical-tests/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/medical-tests/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/medical-tests/$id.delete'

const REMEMBER_KEY = 'medical-tests'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/medical-tests'
)({
  staticData: { breadcrumb: 'Tests' },
  validateSearch: animalTypeItemListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(animalTypeItemListSearchDefaults)],
  },
  // Coming back through the navigation (a link without params) shows the
  // filter of the last visit again, as long as that was recent.
  beforeLoad: ({ search, cause, location }) => {
    const remembered = searchToRestore({
      cause,
      search,
      defaults: animalTypeItemListSearchDefaults,
      key: REMEMBER_KEY,
      schema: animalTypeItemListSearchSchema,
    })
    if (!remembered) return

    throw redirect({
      to: location.pathname,
      search: remembered,
      replace: true,
    })
  },
  // `view` is presentation only and must not trigger a reload.
  loaderDeps: ({ search }) => toAnimalTypeItemListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing the filter or page on the open list must not hold the
    // navigation back; only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listMedicalTestsPageQuery(deps))
      return
    }

    await Promise.all([
      queryClient.ensureQueryData(listMedicalTestsPageQuery(deps)),
      queryClient.ensureQueryData(listAnimalTypesQuery),
    ])
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: medicalTests, isPlaceholderData } = useQuery({
    ...listMedicalTestsPageQuery(toAnimalTypeItemListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })
  const { data: animalTypes } = useQuery(listAnimalTypesQuery)

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: medicalTests,
    rememberKey: REMEMBER_KEY,
  })

  // The loader fills the cache before this renders.
  if (!medicalTests) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link search>
        <PlusIcon />
        Test hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (medicalTest: MedicalTestResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: medicalTest.id }} search>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="icon-sm" variant="destructive_outline" asChild>
            <DeleteRoute.Link
              params={{ id: medicalTest.id }}
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
        search={search}
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
