import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { FormTemplateListPage } from '@/admin/module/form-templates/pages/FormTemplateListPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient'
import { listFormTemplatesPageQuery } from '@/admin/module/form-templates/api/queries'
import {
  plainListSearchDefaults,
  plainListSearchSchema,
  toPlainListParams,
} from '@/components/list/plain-list-search'
import { useListRoute } from '@/components/list/useListRoute'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import type { FormTemplateResource } from '@/api/types/form-templates'
import { Route as NewRoute } from '@/routes/admin/_authenticated/settings/form-templates/new'
import { Route as FormTemplateDetailRoute } from '@/routes/admin/_authenticated/settings/form-templates/$formTemplateId'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/'
)({
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
      void queryClient.prefetchQuery(listFormTemplatesPageQuery(deps))
      return
    }

    await queryClient.ensureQueryData(listFormTemplatesPageQuery(deps))
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: templates, isPlaceholderData } = useQuery({
    ...listFormTemplatesPageQuery(toPlainListParams(search)),
    placeholderData: keepPreviousData,
    // A failed request is left to the router's error handling.
    throwOnError: true,
  })

  const handleSearchChange = useListRoute({
    search,
    navigate,
    list: templates,
  })

  // The loader fills the cache before this renders.
  if (!templates) return null

  const createAction = isAdmin ? (
    <Button asChild>
      <NewRoute.Link>
        <PlusIcon />
        Vorlage erstellen
      </NewRoute.Link>
    </Button>
  ) : undefined

  const renderRowActions = (template: FormTemplateResource) => (
    <div className="flex items-center justify-end gap-1.5">
      <Button size="sm" variant="outline" asChild>
        <FormTemplateDetailRoute.Link params={{ formTemplateId: template.id }}>
          Öffnen
        </FormTemplateDetailRoute.Link>
      </Button>
    </div>
  )

  return (
    <FormTemplateListPage
      templates={templates}
      search={search}
      isUpdating={isPlaceholderData}
      onSearchChange={handleSearchChange}
      createAction={createAction}
      renderRowActions={renderRowActions}
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
