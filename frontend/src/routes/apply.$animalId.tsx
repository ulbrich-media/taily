import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getApplicationFormQuery } from '@/public/module/applicant/api/queries'
import { ApplicationPage } from '@/public/module/applicant/pages/ApplicationPage'
import { ApplicationRouteError } from '@/public/module/applicant/components/ApplicationRouteError'

// The public application of one animal; only reachable by its link.
export const Route = createFileRoute('/apply/$animalId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(getApplicationFormQuery(params.animalId)),
  component: RouteComponent,
  errorComponent: ApplicationRouteError,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  return <ApplicationPage animalId={animalId} />
}
