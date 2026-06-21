import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/people/$id/adoptions/pre-inspections/$preInspectionId/'
)({
  component: () => null,
})
