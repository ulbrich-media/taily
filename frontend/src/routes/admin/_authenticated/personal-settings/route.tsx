import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/personal-settings')(
  {
    staticData: { breadcrumb: 'Persönliche Einstellungen' },
    component: () => <Outlet />,
  }
)
