import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ResetPasswordPage } from '@/auth/pages/ResetPasswordPage.tsx'

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
  const navigate = Route.useNavigate()

  return (
    <ResetPasswordPage
      token={token}
      email={email}
      onSuccess={() => navigate({ to: '/admin/login', replace: true })}
      onRequestNewLink={() => navigate({ to: '/admin/forgot-password' })}
    />
  )
}
