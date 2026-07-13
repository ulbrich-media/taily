import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shadcn/components/ui/alert-dialog'
import { usePasswordConfirmation } from '@/admin/module/security/usePasswordConfirmation'
import { formatApiDateTime } from '@/lib/dates.utils'
import {
  deleteOtherSessions,
  deleteSession,
} from '@/admin/module/security/api/requests'
import { listSessionsQuery } from '@/admin/module/security/api/queries'
import type { Session } from '@/admin/module/security/api/types'

function describeDevice(session: Session): string {
  if (session.browser && session.platform) {
    return `${session.browser} unter ${session.platform}`
  }
  return session.browser ?? session.platform ?? 'Unbekanntes Gerät'
}

/**
 * Security page section listing the account's active sessions (one row per
 * device currently logged in). Signing a device out or signing out
 * everywhere else is gated server-side behind a fresh password confirmation,
 * same as two-factor and passkey management.
 */
export function SessionsSection() {
  const queryClient = useQueryClient()
  const { ensureConfirmed, dialog: passwordDialog } = usePasswordConfirmation()

  const { data: sessions } = useSuspenseQuery(listSessionsQuery)

  const otherSessionsCount = sessions.filter(
    (session) => !session.is_current_device
  ).length

  const invalidateSessions = () =>
    queryClient.invalidateQueries({ queryKey: listSessionsQuery.queryKey })

  const deleteMutation = useMutation({
    mutationFn: deleteSession,
    onSuccess: async () => {
      await invalidateSessions()
      toast.success('Sitzung wurde abgemeldet.')
    },
    onError: () => {
      toast.error('Die Sitzung konnte nicht abgemeldet werden.')
    },
  })

  const deleteOthersMutation = useMutation({
    mutationFn: deleteOtherSessions,
    onSuccess: async () => {
      await invalidateSessions()
      toast.success('Alle anderen Sitzungen wurden abgemeldet.')
    },
    onError: () => {
      toast.error('Die Sitzungen konnten nicht abgemeldet werden.')
    },
  })

  const onDelete = (session: Session) => {
    void (async () => {
      if (await ensureConfirmed()) {
        deleteMutation.mutate(session.id)
      }
    })()
  }

  const onDeleteOthers = () => {
    void (async () => {
      if (await ensureConfirmed()) {
        deleteOthersMutation.mutate()
      }
    })()
  }

  return (
    <>
      <Card className="max-w-2xl">
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Sitzung abmelden"
                      >
                        <LogOut />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sitzung abmelden?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{describeDevice(session)}" wird sofort abgemeldet und
                          muss sich neu anmelden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(session)}
                          disabled={deleteMutation.isPending}
                        >
                          Abmelden
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </li>
            ))}
          </ul>
        </div>

        {otherSessionsCount > 0 && (
          <CardFooter className="flex flex-wrap justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteOthersMutation.isPending}
                >
                  Alle anderen Sitzungen abmelden
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Alle anderen Sitzungen abmelden?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Alle Geräte außer diesem werden sofort abgemeldet und müssen
                    sich neu anmelden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDeleteOthers}
                    disabled={deleteOthersMutation.isPending}
                  >
                    Abmelden
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        )}
      </Card>

      {passwordDialog}
    </>
  )
}
