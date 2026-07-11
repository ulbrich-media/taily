import { createFileRoute } from '@tanstack/react-router'
import { SecurityPage } from '@/admin/module/security/pages/SecurityPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/security'
)({
  staticData: { breadcrumb: 'Sicherheit' },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()

  return <SecurityPage breadcrumb={<BreadcrumbNav items={breadcrumbs} />} />
}
