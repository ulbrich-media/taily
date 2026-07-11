import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorSettingsPage } from '@/admin/module/two-factor/pages/TwoFactorSettingsPage.tsx'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/two-factor'
)({
  staticData: { breadcrumb: 'Zwei-Faktor-Authentifizierung' },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()

  return (
    <TwoFactorSettingsPage breadcrumb={<BreadcrumbNav items={breadcrumbs} />} />
  )
}
