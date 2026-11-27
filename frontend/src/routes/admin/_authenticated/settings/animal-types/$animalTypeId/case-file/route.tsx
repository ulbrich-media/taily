import { createFileRoute, Outlet } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getCatalogueQuery } from '@/admin/module/case-file-catalogue/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types/$animalTypeId/case-file'
)({
  staticData: { breadcrumb: 'Angaben' },
  loader: ({ params }) =>
    queryClient.ensureQueryData(getCatalogueQuery(params.animalTypeId)),
  component: Outlet,
})
