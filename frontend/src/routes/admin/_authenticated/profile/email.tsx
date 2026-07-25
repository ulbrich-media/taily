import { createFileRoute } from '@tanstack/react-router'
import { ChangeEmailDialog } from '@/admin/module/profile/components/ChangeEmailDialog'
import { Route as ProfileRoute } from '@/routes/admin/_authenticated/profile/route'

export const Route = createFileRoute('/admin/_authenticated/profile/email')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = ProfileRoute.useNavigate()

  return <ChangeEmailDialog onClose={() => navigate({})} />
}
