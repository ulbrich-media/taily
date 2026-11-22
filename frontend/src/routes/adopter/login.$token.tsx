import { createFileRoute } from '@tanstack/react-router'
import { UserRound } from 'lucide-react'
import { loginWithLink } from '@/public/module/applicant/api/requests'
import { LinkActionPage } from '@/public/module/applicant/pages/LinkActionPage'
import { Route as PortalRoute } from './index'

export const Route = createFileRoute('/adopter/login/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useParams()
  const navigate = PortalRoute.useNavigate()

  return (
    <LinkActionPage
      icon={UserRound}
      title="Meine Bewerbungen"
      description="Öffne deine Bewerbungen. Die Sitzung gilt zwei Stunden."
      buttonLabel="Zum Portal"
      action={() => loginWithLink(token)}
      onDone={() => navigate({ replace: true })}
    />
  )
}
