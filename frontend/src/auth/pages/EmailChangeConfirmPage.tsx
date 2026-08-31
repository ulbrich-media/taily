import type { ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import {
  confirmEmailChange,
  getEmailChangeDetails,
} from '@/lib/email-change.api'

interface EmailChangeConfirmPageProps {
  token?: string
  onGoToLogin: () => void
}

const FALLBACK_ERROR_DESCRIPTION =
  'Der Link ist ungültig oder abgelaufen. Bitte fordere die Änderung erneut über dein Profil an.'

export function EmailChangeConfirmPage({
  token,
  onGoToLogin,
}: EmailChangeConfirmPageProps) {
  const {
    data: details,
    isLoading: isLoadingDetails,
    isError: detailsFailed,
  } = useQuery({
    queryKey: ['email-change-details', token],
    queryFn: () => getEmailChangeDetails(token!),
    enabled: !!token,
    retry: false,
  })

  const {
    mutate: confirm,
    isPending: isConfirming,
    isSuccess: isConfirmed,
    isError: confirmFailed,
    error: confirmError,
  } = useMutation({
    mutationFn: () => confirmEmailChange(token!),
  })

  const loginButton = (
    <Button type="button" className="w-full" onClick={onGoToLogin}>
      Zur Anmeldung
    </Button>
  )

  if (!token || (detailsFailed && !isConfirmed)) {
    return (
      <ConfirmCard
        title="Ungültiger Link"
        description={FALLBACK_ERROR_DESCRIPTION}
        footer={loginButton}
      />
    )
  }

  if (isLoadingDetails) {
    return (
      <ConfirmCard title="Lädt..." description="Bitte warte einen Moment." />
    )
  }

  if (isConfirmed) {
    return (
      <ConfirmCard
        title="E-Mail-Adresse geändert"
        description="Deine neue E-Mail-Adresse ist jetzt aktiv. Du kannst dich damit anmelden."
        footer={loginButton}
      />
    )
  }

  if (confirmFailed) {
    return (
      <ConfirmCard
        title="Bestätigung fehlgeschlagen"
        description={
          confirmError instanceof Error
            ? confirmError.message
            : FALLBACK_ERROR_DESCRIPTION
        }
        footer={loginButton}
      />
    )
  }

  return (
    <ConfirmCard
      title="E-Mail-Adresse ändern"
      description="Bestätige, dass die E-Mail-Adresse deines Kontos geändert werden soll."
      footer={
        <Button
          type="button"
          className="w-full"
          onClick={() => confirm()}
          disabled={isConfirming}
        >
          {isConfirming ? 'Wird bestätigt...' : 'Bestätigen'}
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Bisher</span>
        <span className="font-medium">{details?.old_email}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Neu</span>
        <span className="font-medium">{details?.new_email}</span>
      </div>
    </ConfirmCard>
  )
}

interface ConfirmCardProps {
  title: string
  description: string
  footer?: ReactNode
  children?: ReactNode
}

function ConfirmCard({
  title,
  description,
  footer,
  children,
}: ConfirmCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full sm:max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children && (
          <CardContent className="space-y-2">{children}</CardContent>
        )}
        {footer && <CardFooter>{footer}</CardFooter>}
      </Card>
    </div>
  )
}
