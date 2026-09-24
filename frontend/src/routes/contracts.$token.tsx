import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/queryClient'
import { getPublicContractQuery } from '@/public/module/contracts/api/queries'
import { ContractSignPage } from '@/public/module/contracts/pages/ContractSignPage'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/contracts/$token')({
  loader: ({ params }) =>
    queryClient.ensureQueryData(getPublicContractQuery(params.token)),
  component: RouteComponent,
  errorComponent: ContractErrorPage,
})

function RouteComponent() {
  const { token } = Route.useParams()
  return <ContractSignPage token={token} />
}

function ContractErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle variant="destructive">Vertrag nicht gefunden</CardTitle>
          <CardTitleIcon icon={AlertCircle} />
          <CardDescription>
            Dieser Link ist ungültig, abgelaufen oder wurde bereits verwendet.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
