import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/settings')({
  staticData: { breadcrumb: 'Einstellungen' },
  component: () => <Outlet />,
})
