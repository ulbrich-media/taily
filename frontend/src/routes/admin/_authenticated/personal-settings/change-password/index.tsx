import { createFileRoute } from '@tanstack/react-router'
import { ChangePasswordPage } from '@/admin/module/profile/pages/ChangePasswordPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as PersonalSettingsIndexRoute } from '@/routes/admin/_authenticated/personal-settings/index'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/change-password/'
)({
  staticData: { breadcrumb: 'Passwort ändern' },
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  const navigate = PersonalSettingsIndexRoute.useNavigate()

  return (
    <ChangePasswordPage
      breadcrumb={<BreadcrumbNav items={breadcrumbs} size="sm" />}
      onClose={() => {
        navigate({})
      }}
    />
  )
}
