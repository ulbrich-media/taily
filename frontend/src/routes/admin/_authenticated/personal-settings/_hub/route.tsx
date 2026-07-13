import { createFileRoute, Outlet } from '@tanstack/react-router'
import { PersonalSettingsPage } from '@/admin/pages/PersonalSettingsPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'
import { Route as SecurityRoute } from '@/routes/admin/_authenticated/personal-settings/security'
import { Button } from '@/shadcn/components/ui/button'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/_hub'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  return (
    <>
      <PersonalSettingsPage
        breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
        securityAction={
          <Button variant="default_outline" asChild>
            <SecurityRoute.Link aria-label="Sicherheit öffnen">
              Öffnen
            </SecurityRoute.Link>
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
