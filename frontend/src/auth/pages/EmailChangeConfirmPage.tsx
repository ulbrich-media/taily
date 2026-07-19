import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { confirmEmailChange } from '@/lib/email-change.api'

interface EmailChangeConfirmPageProps {
  token?: string
  onGoToLogin: () => void
}

export function EmailChangeConfirmPage({
  token,
  onGoToLogin,
}: EmailChangeConfirmPageProps) {
  const { isLoading, isSuccess } = useQuery({
    queryKey: ['email-change-confirm', token],
    queryFn: () => confirmEmailChange(token!),
    enabled: !!token,
    retry: false,
  })

  const title = !token
    ? 'Ungültiger Link'
    : isLoading
      ? 'E-Mail-Adresse wird bestätigt...'
      : isSuccess
        ? 'E-Mail-Adresse geändert'
        : 'Bestätigung fehlgeschlagen'

  const description = !token
    ? 'Der Link zur Bestätigung der E-Mail-Adresse ist ungültig.'
    : isLoading
      ? 'Bitte warte einen Moment.'
      : isSuccess
        ? 'Deine neue E-Mail-Adresse ist jetzt aktiv. Du kannst dich damit anmelden.'
        : 'Der Link ist ungültig oder abgelaufen. Bitte fordere die Änderung erneut über dein Profil an.'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full sm:max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button type="button" className="w-full" onClick={onGoToLogin}>
            Zur Anmeldung
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
