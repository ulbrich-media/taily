import { AlertCircle } from 'lucide-react'
import { ApiValidationError } from '@/lib/api'
import { isSentryEnabled, showCrashReportDialog } from '@/lib/sentry'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { ApplicantLayout } from './ApplicantLayout'

/** Error screen of the public application route: only a real 404 means "not found". */
export function ApplicationRouteError({ error }: { error: unknown }) {
  if (error instanceof ApiValidationError && error.status === 404) {
    return (
      <ApplicantLayout>
        <Card className="mx-auto w-full sm:max-w-md">
          <CardHeader>
            <CardTitle variant="destructive">
              Bewerbung nicht gefunden
            </CardTitle>
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

  console.error('Error caught by application route', error)

  return (
    <ApplicantLayout>
      <Card className="mx-auto w-full sm:max-w-md">
        <CardHeader>
          <CardTitle variant="destructive">Etwas ist schiefgelaufen</CardTitle>
          <CardTitleIcon icon={AlertCircle} />
          <CardDescription>
            Das hat leider nicht geklappt. Bitte lade die Seite neu und versuch
            es noch einmal.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            Seite neu laden
          </Button>
          {isSentryEnabled() && (
            <Button
              type="button"
              variant="outline"
              onClick={showCrashReportDialog}
            >
              Problem melden
            </Button>
          )}
        </CardContent>
      </Card>
    </ApplicantLayout>
  )
}
