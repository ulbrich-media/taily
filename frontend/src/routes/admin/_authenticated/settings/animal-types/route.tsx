import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/animal-types'
)({
  staticData: { breadcrumb: 'Tierarten' },
  component: Outlet,
})
