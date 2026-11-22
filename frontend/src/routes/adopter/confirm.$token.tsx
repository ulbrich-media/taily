import { createFileRoute } from '@tanstack/react-router'
import { MailCheck } from 'lucide-react'
import { confirmApplication } from '@/public/module/applicant/api/requests'
import { LinkActionPage } from '@/public/module/applicant/pages/LinkActionPage'
import { Route as PortalRoute } from './index'

// The double opt-in of a public application; confirming is the first login.
export const Route = createFileRoute('/adopter/confirm/$token')({
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useParams()
  const navigate = PortalRoute.useNavigate()

  return (
    <LinkActionPage
      icon={MailCheck}
      title="Bewerbung bestätigen"
      description="Mit einem Klick bestätigst du deine E-Mail-Adresse. Danach siehst du deine Bewerbung und kannst deine Angaben ergänzen."
      buttonLabel="Bewerbung bestätigen"
      action={() => confirmApplication(token)}
      onDone={() => navigate({ replace: true })}
    />
  )
}
