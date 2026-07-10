import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PersonalSettingsPage } from '@/admin/pages/PersonalSettingsPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'
import { Route as ChangePasswordRoute } from '@/routes/admin/_authenticated/personal-settings/change-password/index'
import { Button } from '@/shadcn/components/ui/button'

export const Route = createFileRoute('/admin/_authenticated/personal-settings')(
  {
    staticData: { breadcrumb: 'Persönliche Einstellungen' },
    component: RouteComponent,
  }
)

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  return (
    <>
      <PersonalSettingsPage
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        changePasswordAction={
          <Button variant="default_outline" asChild>
            <ChangePasswordRoute.Link aria-label="Passwort ändern öffnen">
              Öffnen
            </ChangePasswordRoute.Link>
          </Button>
        }
        apiTokensAction={
          <Button variant="default_outline" asChild>
            <ApiTokensRoute.Link aria-label="API Tokens öffnen">
              Öffnen
            </ApiTokensRoute.Link>
          </Button>
        }
      />
      <Outlet />
    </>
  )
}
