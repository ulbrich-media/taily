import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/auth/pages/ForgotPasswordPage.tsx'
import { Route as LoginRoute } from '@/routes/admin/login'

export const Route = createFileRoute('/admin/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToLogin = LoginRoute.useNavigate()

  return <ForgotPasswordPage onBackToLogin={() => navigateToLogin({})} />
}
