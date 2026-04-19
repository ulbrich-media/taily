import { createFileRoute } from '@tanstack/react-router'
import { FormTemplateListPage } from '@/admin/module/form-templates/pages/FormTemplateListPage'
import { queryClient } from '@/lib/queryClient'
import { listFormTemplatesQuery } from '@/admin/module/form-templates/api/queries'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth.hook'
import { Button } from '@/shadcn/components/ui/button'
import { Edit, Eye, PlusIcon } from 'lucide-react'
import type { FormTemplateResource } from '@/api/types/form-templates'
import { Route as NewRoute } from '@/routes/admin/_authenticated/settings/form-templates/new'
import { Route as FormTemplateDetailRoute } from '@/routes/admin/_authenticated/settings/form-templates/$formTemplateId'
import { Route as FormTemplateEditRoute } from '@/routes/admin/_authenticated/settings/form-templates/$formTemplateId.edit'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates/'
)({
  loader: async () => {
    await queryClient.ensureQueryData(listFormTemplatesQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { isAdmin } = useAuth()
  const { data } = useSuspenseQuery(listFormTemplatesQuery)

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
      <Button size="sm" variant="ghost" asChild>
        <FormTemplateDetailRoute.Link params={{ formTemplateId: template.id }}>
          <Eye /> Ansehen
        </FormTemplateDetailRoute.Link>
      </Button>
      {isAdmin && (
        <Button size="sm" variant="outline" asChild>
          <FormTemplateEditRoute.Link params={{ formTemplateId: template.id }}>
            <Edit /> Bearbeiten
          </FormTemplateEditRoute.Link>
        </Button>
      )}
    </div>
  )

  return (
    <FormTemplateListPage
      templates={data.data}
      createAction={createAction}
      renderRowActions={renderRowActions}
    />
  )
}
