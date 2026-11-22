import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { Spinner } from '@/shadcn/components/ui/spinner'
import { ApiValidationError } from '@/lib/api'
import {
  applicantQueryKeys,
  getPortalOverviewQuery,
} from '@/public/module/applicant/api/queries'
import { logout } from '@/public/module/applicant/api/requests'
import {
  clearSessionToken,
  getSessionToken,
} from '@/public/module/applicant/session'
import { PortalLoginPage } from '@/public/module/applicant/pages/PortalLoginPage'
import { PortalOverviewPage } from '@/public/module/applicant/pages/PortalOverviewPage'
import { Route as AdoptionRoute } from './adoptions.$adoptionId'

// The applicant portal: the login form without a session, the applicant's
// adoptions with one (docs/features/applicant-portal.md).
export const Route = createFileRoute('/adopter/')({
  component: RouteComponent,
})

function RouteComponent() {
  const queryClient = useQueryClient()
  const hasSession = getSessionToken() !== null
  const overview = useQuery({
    ...getPortalOverviewQuery(),
    enabled: hasSession,
  })

  const expired =
    overview.error instanceof ApiValidationError &&
    overview.error.status === 401

  if (!hasSession || expired) {
    if (expired) clearSessionToken()
    return (
      <PortalLoginPage
        notice={
          expired
            ? 'Deine Sitzung ist abgelaufen. Lass dir einen neuen Link schicken.'
            : undefined
        }
      />
    )
  }

  if (!overview.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const logoutAction = (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await logout().catch(() => undefined)
        clearSessionToken()
        queryClient.removeQueries({ queryKey: applicantQueryKeys.all })
      }}
    >
      <LogOut />
      Abmelden
    </Button>
  )

  return (
    <PortalOverviewPage
      overview={overview.data}
      logoutAction={logoutAction}
      renderOpenLink={(adoptionId, children) => (
        <Button variant="outline" size="sm" asChild>
          <AdoptionRoute.Link params={{ adoptionId }}>
            {children}
          </AdoptionRoute.Link>
        </Button>
      )}
    />
  )
}
