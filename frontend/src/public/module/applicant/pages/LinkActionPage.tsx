import { useMutation } from '@tanstack/react-query'
import { AlertCircle, type LucideIcon } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { ApplicantLayout } from '../components/ApplicantLayout'
import { setSessionToken } from '../session'
import type { SessionResponse } from '../api/types'

interface LinkActionPageProps {
  icon: LucideIcon
  title: string
  description: string
  buttonLabel: string
  action: () => Promise<SessionResponse>
  onDone: () => void
}

/**
 * The page behind an emailed link. Opening it changes nothing; only the
 * button uses the single-use link — mail scanners open links on their own
 * and would otherwise use it up (docs/features/applicant-portal.md).
 */
export function LinkActionPage({
  icon,
  title,
  description,
  buttonLabel,
  action,
  onDone,
}: LinkActionPageProps) {
  const mutation = useMutation({
    mutationFn: action,
    onSuccess: (response) => {
      setSessionToken(response.session_token)
      onDone()
    },
  })

  return (
    <ApplicantLayout>
      <Card className="mx-auto w-full sm:max-w-md">
        {mutation.isError ? (
          <CardHeader>
            <CardTitle variant="destructive">Link nicht mehr gültig</CardTitle>
            <CardTitleIcon icon={AlertCircle} />
            <CardDescription>
              Dieser Link ist abgelaufen oder wurde schon verwendet. Unter
              „Meine Bewerbungen“ kannst du dir einen neuen schicken lassen.
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardTitleIcon icon={icon} />
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                className="w-full"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {buttonLabel}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </ApplicantLayout>
  )
}
