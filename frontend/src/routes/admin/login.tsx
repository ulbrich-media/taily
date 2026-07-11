import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/auth/pages/LoginPage.tsx'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'
import { Route as ForgotPasswordRoute } from '@/routes/admin/forgot-password'

export const Route = createFileRoute('/admin/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = DashboardRoute.useNavigate()
  const navigateToForgotPassword = ForgotPasswordRoute.useNavigate()

  return (
    <LoginPage
      onAlreadyAuthenticated={() => navigate({ replace: true })}
      onForgotPassword={() => navigateToForgotPassword({})}
    />
  )
}
