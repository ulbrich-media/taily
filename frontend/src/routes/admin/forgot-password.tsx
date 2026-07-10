import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordPage } from '@/auth/pages/ForgotPasswordPage.tsx'

export const Route = createFileRoute('/admin/forgot-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <ForgotPasswordPage
      onBackToLogin={() => navigate({ to: '/admin/login' })}
    />
  )
}
