import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { LogOut, Monitor } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import { Badge } from '@/shadcn/components/ui/badge'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { TextInput } from '@/components/field/TextInput'
import { formatApiDateTime } from '@/lib/dates.utils'
import { ApiValidationError } from '@/lib/api'
import {
  deleteOtherSessions,
  deleteSession,
} from '@/admin/module/security/api/requests'
import { listSessionsQuery } from '@/admin/module/security/api/queries'
import type { Session } from '@/admin/module/security/api/types'

const passwordSchema = z.object({
  password: z.string().min(1, 'Bitte gib dein Passwort ein'),
})

type PasswordFormData = z.infer<typeof passwordSchema>

function describeDevice(session: Session): string {
  if (session.browser && session.platform) {
    return `${session.browser} unter ${session.platform}`
  }
  return session.browser ?? session.platform ?? 'Unbekanntes Gerät'
}

interface SessionsSectionProps {
  sessions: Session[]
}

/**
 * Security page section listing the account's active sessions (one row per
 * device currently logged in). Signing a device out requires the password
 * again, not just a fresh password confirmation: the server rotates the
 * account's "remember me" token so the signed-out device can't silently
 * re-authenticate, and that needs the plaintext password (see
 * `SessionController::rotateRememberToken`). The list itself is resolved by
 * the route and passed down as a prop; this component never fetches it.
 */
export function SessionsSection({ sessions }: SessionsSectionProps) {
  const queryClient = useQueryClient()

  const [targetSession, setTargetSession] = useState<Session | null>(null)
  const [signOutOthersOpen, setSignOutOthersOpen] = useState(false)

  const otherSessionsCount = sessions.filter(
    (session) => !session.is_current_device
  ).length

  const invalidateSessions = () =>
    queryClient.invalidateQueries({ queryKey: listSessionsQuery.queryKey })

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  })

  const closeDialogs = () => {
    setTargetSession(null)
    setSignOutOthersOpen(false)
    form.reset()
  }

  const handleError = (err: unknown) => {
    if (err instanceof ApiValidationError && err.errors?.password) {
      form.setError('password', { message: 'Das Passwort ist falsch.' })
      return
    }
    toast.error('Die Sitzung konnte nicht abgemeldet werden.')
  }

  const deleteMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      deleteSession(id, password),
    onSuccess: async () => {
      await invalidateSessions()
      closeDialogs()
      toast.success('Sitzung wurde abgemeldet.')
    },
    onError: handleError,
  })

  const deleteOthersMutation = useMutation({
    mutationFn: (password: string) => deleteOtherSessions(password),
    onSuccess: async () => {
      await invalidateSessions()
      closeDialogs()
      toast.success('Alle anderen Sitzungen wurden abgemeldet.')
    },
    onError: handleError,
  })

  const isPending = deleteMutation.isPending || deleteOthersMutation.isPending

  const onSubmit = (data: PasswordFormData) => {
    if (targetSession) {
      deleteMutation.mutate({ id: targetSession.id, password: data.password })
    } else if (signOutOthersOpen) {
      deleteOthersMutation.mutate(data.password)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Sitzungen</CardTitle>
          <CardTitleIcon icon={Monitor} />
          <CardDescription>
            Geräte, auf denen dein Konto aktuell angemeldet ist. Du kannst
            einzelne Sitzungen oder alle anderen auf einmal abmelden.
          </CardDescription>
        </CardHeader>

        <div className="px-6">
          <ul className="divide-y rounded-md border">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    {describeDevice(session)}
                    {session.is_current_device && (
                      <Badge variant="secondary">Dieses Gerät</Badge>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {session.ip_address ? `${session.ip_address} · ` : ''}
                    Zuletzt aktiv am {formatApiDateTime(session.last_active_at)}
                  </p>
                </div>
                {!session.is_current_device && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Sitzung abmelden"
                    onClick={() => setTargetSession(session)}
                  >
                    <LogOut />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {otherSessionsCount > 0 && (
          <CardFooter className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSignOutOthersOpen(true)}
            >
              Alle anderen Sitzungen abmelden
            </Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog
        open={targetSession !== null || signOutOthersOpen}
        onOpenChange={(next) => !next && closeDialogs()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {targetSession
                ? 'Sitzung abmelden?'
                : 'Alle anderen Sitzungen abmelden?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {targetSession
                ? `"${describeDevice(targetSession)}" wird sofort abgemeldet und muss sich neu anmelden. Bitte bestätige dein Passwort.`
                : 'Alle Geräte außer diesem werden sofort abgemeldet und müssen sich neu anmelden. Bitte bestätige dein Passwort.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form
            id="form-session-sign-out"
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            <FieldGroup>
              <TextInput
                name="password"
                control={form.control}
                label="Passwort"
                type="password"
                autoComplete="current-password"
                autoFocus
              />
            </FieldGroup>
          </form>

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialogs}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              form="form-session-sign-out"
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? 'Wird abgemeldet...' : 'Ja, abmelden'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
