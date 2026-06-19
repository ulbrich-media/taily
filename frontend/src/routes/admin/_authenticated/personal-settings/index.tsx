import { createFileRoute } from '@tanstack/react-router'
import { PersonalSettingsPage } from '@/admin/pages/PersonalSettingsPage'
import { useBreadcrumbs } from '@/router/useBreadcrumbs'
import { BreadcrumbNav } from '@/router/BreadcrumbNav'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'
import { Button } from '@/shadcn/components/ui/button'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbs = useBreadcrumbs()
  return (
    <PersonalSettingsPage
      breadcrumb={<BreadcrumbNav items={breadcrumbs} />}
      apiTokensAction={
        <Button asChild>
          <ApiTokensRoute.Link>Öffnen</ApiTokensRoute.Link>
        </Button>
      }
    />
  )
}
