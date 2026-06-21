import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/people/$id/adoptions')({
  staticData: { breadcrumb: 'Vermittlungen' },
  component: () => <Outlet />,
})
