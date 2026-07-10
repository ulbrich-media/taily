import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/_authenticated/personal-settings/_hub/')(
  {
    component: () => null,
  }
)
