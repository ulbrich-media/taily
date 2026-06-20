import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/organizations'
)({
  staticData: { breadcrumb: 'Organisationen' },
  component: () => <Outlet />,
})
