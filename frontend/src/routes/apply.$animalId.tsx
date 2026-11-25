import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle } from 'lucide-react'
import { ErrorInfoComponent } from '@/components/ErrorInfoComponent'
import { ApiValidationError } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { getApplicationFormQuery } from '@/public/module/applicant/api/queries'
import { ApplicationPage } from '@/public/module/applicant/pages/ApplicationPage'
import { ApplicantLayout } from '@/public/module/applicant/components/ApplicantLayout'

// The public application of one animal; only reachable by its link.
export const Route = createFileRoute('/apply/$animalId')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(getApplicationFormQuery(params.animalId)),
  component: RouteComponent,
  errorComponent: RouteError,
})

function RouteComponent() {
  const { animalId } = Route.useParams()
  return <ApplicationPage animalId={animalId} />
}

// Only a real 404 means "not found"; everything else uses the generic error screen.
function RouteError({ error }: { error: unknown }) {
  if (!(error instanceof ApiValidationError && error.status === 404)) {
    return (
      <ApplicantLayout>
        <div className="mx-auto w-full sm:max-w-md">
          <ErrorInfoComponent error={error} />
        </div>
      </ApplicantLayout>
    )
  }

  return (
    <ApplicantLayout>
      <Card className="mx-auto w-full sm:max-w-md">
        <CardHeader>
          <CardTitle variant="destructive">Bewerbung nicht gefunden</CardTitle>
          <CardTitleIcon icon={AlertCircle} />
          <CardDescription>
            Dieser Link ist ungültig. Bitte frag bei der Organisation nach dem
            richtigen Link.
          </CardDescription>
        </CardHeader>
      </Card>
    </ApplicantLayout>
  )
}
