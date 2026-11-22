import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/settings/case-file/$animalTypeId/_editor/'
)({
  component: () => null,
})
