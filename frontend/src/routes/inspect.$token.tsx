import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPublicInspectionQuery } from '@/public/module/pre-inspections/api/queries'
import { PreInspectionSubmitPage } from '@/public/module/pre-inspections/pages/PreInspectionSubmitPage'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/inspect/$token')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(getPublicInspectionQuery(params.token)),
  component: RouteComponent,
  errorComponent: InspectionErrorPage,
})

function RouteComponent() {
  const { token } = Route.useParams()
  return <PreInspectionSubmitPage token={token} />
}

function InspectionErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle variant="destructive">
            <CardTitleIcon icon={AlertCircle} />
            Vorkontrolle nicht gefunden
          </CardTitle>
          <CardDescription>
            Dieser Link ist ungültig, abgelaufen oder die Vorkontrolle wurde
            bereits eingereicht.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
