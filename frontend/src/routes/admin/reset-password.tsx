import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from '@/auth/pages/ResetPasswordPage.tsx'
import { Route as LoginRoute } from '@/routes/admin/login'
import { Route as ForgotPasswordRoute } from '@/routes/admin/forgot-password'

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
  email: z.string().optional(),
})

export const Route = createFileRoute('/admin/reset-password')({
  validateSearch: resetPasswordSearchSchema,
  component: RouteComponent,
})

function RouteComponent() {
  const { token, email } = Route.useSearch()
  const navigateToLogin = LoginRoute.useNavigate()
  const navigateToForgotPassword = ForgotPasswordRoute.useNavigate()

  return (
    <ResetPasswordPage
      token={token}
      email={email}
      onSuccess={() => navigateToLogin({ replace: true })}
      onRequestNewLink={() => navigateToForgotPassword({})}
    />
  )
}
