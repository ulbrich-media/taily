import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { EmailChangeConfirmPage } from '@/auth/pages/EmailChangeConfirmPage.tsx'
import { Route as LoginRoute } from '@/routes/admin/login'

const emailChangeConfirmSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/admin/email-change-confirm')({
  validateSearch: emailChangeConfirmSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { token } = Route.useSearch()
  const navigateToLogin = LoginRoute.useNavigate()

  return (
    <EmailChangeConfirmPage
      token={token}
      onGoToLogin={() => navigateToLogin({ replace: true })}
    />
  )
}
