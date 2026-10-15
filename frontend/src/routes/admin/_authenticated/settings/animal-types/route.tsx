import {
  createFileRoute,
  Outlet,
  stripSearchParams,
} from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Edit, PlusIcon, Trash2 } from 'lucide-react'
import { AnimalTypeListPage } from '@/admin/module/animal-types/pages/AnimalTypeListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listAnimalTypesPageQuery } from '@/admin/module/animal-types/api/queries'
import {
  plainListSearchDefaults,
  plainListSearchSchema,
  toPlainListParams,
} from '@/components/list/plain-list-search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import { Route as CreateRoute } from '@/routes/admin/_authenticated/settings/animal-types/create'
import { Route as EditRoute } from '@/routes/admin/_authenticated/settings/animal-types/$id.edit'
import { Route as DeleteRoute } from '@/routes/admin/_authenticated/settings/animal-types/$id.delete'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types'
)({
  staticData: { breadcrumb: 'Tierarten' },
  validateSearch: plainListSearchSchema,
  search: {
    // Keep the URL short: parameters at their default are not written.
    middlewares: [stripSearchParams(plainListSearchDefaults)],
  },
  // `view` is presentation only and must not trigger a reload.
  loaderDeps: ({ search }) => toPlainListParams(search),
  loader: async ({ deps, cause }) => {
    // Changing the page on the open list must not hold the navigation back;
    // only entering the list waits for its data.
    if (cause === 'stay') {
      void queryClient.prefetchQuery(listAnimalTypesPageQuery(deps))
      return
    }

    await queryClient.ensureQueryData(listAnimalTypesPageQuery(deps))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: animalTypes, isPlaceholderData } = useQuery({
    ...listAnimalTypesPageQuery(toPlainListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: animalTypes,
  })

  // The loader fills the cache before this renders.
  if (!animalTypes) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <CreateRoute.Link search>
        <PlusIcon />
        Tierart hinzufügen
      </CreateRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = isAdmin
    ? (animalType: AnimalTypeResource) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <EditRoute.Link params={{ id: animalType.id }} search>
              <Edit /> Bearbeiten
            </EditRoute.Link>
          </Button>
          <Button size="sm" variant="destructive_outline" asChild>
            <DeleteRoute.Link params={{ id: animalType.id }} search>
              <Trash2 /> Löschen
            </DeleteRoute.Link>
          </Button>
        </div>
      )
    : undefined

  return (
    <>
      <AnimalTypeListPage
        animalTypes={animalTypes}
        search={search}
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
