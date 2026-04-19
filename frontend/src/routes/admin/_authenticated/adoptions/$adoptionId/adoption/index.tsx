import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/adoption/'
)({
  component: () => null,
})
