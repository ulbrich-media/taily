import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { Spinner } from '@/shadcn/components/ui/spinner'
import { ApiValidationError } from '@/lib/api'
import { getPortalAdoptionQuery } from '@/public/module/applicant/api/queries'
import { clearSessionToken } from '@/public/module/applicant/session'
import { PortalAdoptionPage } from '@/public/module/applicant/pages/PortalAdoptionPage'
import { PortalLoginPage } from '@/public/module/applicant/pages/PortalLoginPage'
import { Route as PortalRoute } from './index'

export const Route = createFileRoute('/adopter/adoptions/$adoptionId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { adoptionId } = Route.useParams()
  const adoption = useQuery(getPortalAdoptionQuery(adoptionId))

  if (adoption.error instanceof ApiValidationError) {
    if (adoption.error.status === 401) {
      clearSessionToken()
      return (
        <PortalLoginPage notice="Deine Sitzung ist abgelaufen. Lass dir einen neuen Link schicken." />
      )
    }
    return (
      <PortalLoginPage notice="Diese Bewerbung haben wir nicht gefunden." />
    )
  }

  if (!adoption.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <PortalAdoptionPage
      adoption={adoption.data}
      backLink={
        <Button variant="ghost" size="sm" asChild>
          <PortalRoute.Link>
            <ArrowLeft />
            Meine Bewerbungen
          </PortalRoute.Link>
        </Button>
      }
    />
  )
}
