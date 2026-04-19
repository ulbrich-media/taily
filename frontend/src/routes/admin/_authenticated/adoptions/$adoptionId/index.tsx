import { createFileRoute } from '@tanstack/react-router'
import { Route as AdoptionTabRoute } from './adoption/index.tsx'
import { useEffect } from 'react'

export const Route = createFileRoute(
  '/admin/_authenticated/adoptions/$adoptionId/'
)({
  component: RouteComponent,
})

function RouteComponent() {
  const navigateToAdoptionTab = AdoptionTabRoute.useNavigate()

  useEffect(() => {
    navigateToAdoptionTab({})
  })

  return null
}
