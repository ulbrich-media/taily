import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/form-templates'
)({
  component: Outlet,
  staticData: { breadcrumb: 'Formularvorlagen' },
})
