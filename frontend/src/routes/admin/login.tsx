import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/auth/pages/LoginPage.tsx'
import { Route as DashboardRoute } from '@/routes/admin/_authenticated/index'

export const Route = createFileRoute('/admin/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = DashboardRoute.useNavigate()
  const loginNavigate = Route.useNavigate()

  return (
    <LoginPage
      onAlreadyAuthenticated={() => navigate({ replace: true })}
      onForgotPassword={() => loginNavigate({ to: '/admin/forgot-password' })}
    />
  )
}
