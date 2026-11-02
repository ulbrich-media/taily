import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/contracts'
)({
  staticData: { breadcrumb: 'Verträge' },
  beforeLoad: ({ context }) => {
    if (!context.isAdmin) {
      throw new Error('403: Forbidden - Admin access required')
    }
  },
  component: Outlet,
})
