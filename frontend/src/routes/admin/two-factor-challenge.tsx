import { createFileRoute } from '@tanstack/react-router'
import { TwoFactorChallengePage } from '@/auth/pages/TwoFactorChallengePage.tsx'
import { Route as LoginRoute } from '@/routes/admin/login'

export const Route = createFileRoute('/admin/two-factor-challenge')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToLogin = LoginRoute.useNavigate()

  return <TwoFactorChallengePage onBackToLogin={() => navigateToLogin({})} />
}
