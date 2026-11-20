import { createFileRoute } from '@tanstack/react-router'
import { Route as AnimalStatusRoute } from '@/routes/admin/_authenticated/animals/_animalDetail/$animalTypeId.animal.$animalId/status'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExportSettingsPage } from '@/admin/pages/ExportSettingsPage'
import { tiervermittlungSettingsQuery } from '@/admin/module/export-settings/api/queries'
import { updateTiervermittlungSettings } from '@/admin/module/export-settings/api/requests'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/lib/auth.hook'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'

export const Route = createFileRoute('/admin/_authenticated/settings/export')({
  staticData: { breadcrumb: 'Export' },
  loader: async () => {
    await queryClient.ensureQueryData(tiervermittlungSettingsQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const { isAdmin } = useAuth()
  const client = useQueryClient()
  const { data } = useSuspenseQuery(tiervermittlungSettingsQuery)

  const saveMutation = useMutation({
    mutationFn: updateTiervermittlungSettings,
    onSuccess: ({ message, ...settings }) => {
      client.setQueryData(tiervermittlungSettingsQuery.queryKey, settings)
      toast.success(message)
    },
  })

  return (
    <ExportSettingsPage
      compatibleWith={data.compatibleWith}
      status={data.status}
      isAdmin={isAdmin}
      isSaving={saveMutation.isPending}
      onSave={(compatibleWith) => saveMutation.mutate({ compatibleWith })}
      renderAnimalLink={(item) =>
        item.animal_type_id ? (
          <AnimalStatusRoute.Link
            params={{
              animalTypeId: item.animal_type_id,
              animalId: item.animal_id,
            }}
            className="text-primary underline-offset-4 hover:underline"
          >
            {item.name ?? 'Tier'}
          </AnimalStatusRoute.Link>
        ) : (
          <span>{item.name ?? 'Tier'}</span>
        )
      }
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
    />
  )
}
