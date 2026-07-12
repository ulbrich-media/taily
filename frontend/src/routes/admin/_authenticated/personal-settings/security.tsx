import { createFileRoute } from '@tanstack/react-router'
import { SecurityPage } from '@/admin/module/security/pages/SecurityPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { queryClient } from '@/lib/queryClient.ts'
import { listPasskeysQuery } from '@/admin/module/security/api/queries'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/security'
)({
  staticData: { breadcrumb: 'Sicherheit' },
  loader: async () => {
    await queryClient.ensureQueryData(listPasskeysQuery)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()

  return <SecurityPage breadcrumb={<BreadcrumbNav items={breadcrumbs} />} />
}
