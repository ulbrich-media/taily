import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/people')({
  staticData: { breadcrumb: 'Personen' },
  component: () => <Outlet />,
})
