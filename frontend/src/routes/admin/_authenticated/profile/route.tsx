import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProfilePage } from '@/admin/pages/ProfilePage'
import { Route as EmailRoute } from '@/routes/admin/_authenticated/profile/email'

export const Route = createFileRoute('/admin/_authenticated/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToEmail = EmailRoute.useNavigate()

  return (
    <>
      <ProfilePage onChangeEmail={() => navigateToEmail({})} />
      <Outlet />
    </>
  )
}
