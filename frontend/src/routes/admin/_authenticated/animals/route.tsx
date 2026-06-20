import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/animals')({
  staticData: { breadcrumb: 'Tiere' },
  component: () => <Outlet />,
})
