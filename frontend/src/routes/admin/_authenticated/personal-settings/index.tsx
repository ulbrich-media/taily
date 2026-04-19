import { createFileRoute } from '@tanstack/react-router'
import { PersonalSettingsPage } from '@/admin/pages/PersonalSettingsPage'
import { Route as ApiTokensRoute } from '@/routes/admin/_authenticated/personal-settings/api-tokens/route'
import { Button } from '@/shadcn/components/ui/button'

export const Route = createFileRoute(
  '/admin/_authenticated/personal-settings/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PersonalSettingsPage
      apiTokensAction={
        <Button asChild>
          <ApiTokensRoute.Link>Öffnen</ApiTokensRoute.Link>
        </Button>
      }
    />
  )
}
