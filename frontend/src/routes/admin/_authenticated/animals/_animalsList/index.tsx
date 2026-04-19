import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/admin/_authenticated/animals/_animalsList/'
)({
  component: () => null,
})
