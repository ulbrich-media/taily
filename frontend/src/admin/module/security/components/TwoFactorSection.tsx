import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ShieldCheck, ShieldOff, Copy } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { TextInput } from '@/components/field/TextInput'
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
import { useAuth } from '@/lib/auth.hook'
import { usePasswordConfirmation } from '@/admin/module/security/usePasswordConfirmation'
import { ApiValidationError } from '@/lib/api'
import {
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  getRecoveryCodes,
  getTwoFactorQrCode,
  getTwoFactorSecret,
  regenerateRecoveryCodes,
} from '@/admin/module/security/api/requests'

interface SetupData {
  svg: string
  secretKey: string
  recoveryCodes: string[]
}

const confirmSchema = z.object({
  code: z.string().min(1, 'Bitte gib den Code aus deiner App ein'),
})

type ConfirmFormData = z.infer<typeof confirmSchema>

/**
 * Security page section for two-factor authentication. Shows the current state
 * and launches the enrolment and recovery-code dialogs. Disabling, revealing
 * the secret, and viewing/regenerating recovery codes are gated server-side
 * behind a fresh password confirmation; each runs only once the confirmation is
 * in place (the user is prompted if it isn't).
 */
export function TwoFactorSection() {
  const { user, refreshProfile } = useAuth()
  const isEnabled = user?.two_factor_enabled ?? false

  const { ensureConfirmed, dialog: passwordDialog } = usePasswordConfirmation()

  const runConfirmed = async (action: () => void) => {
    if (await ensureConfirmed()) {
      action()
    }
  }

  // Populated while the user is enrolling (secret generated, not yet confirmed).
  const [setup, setSetup] = useState<SetupData | null>(null)
  // Recovery codes revealed for an already-active second factor.
  const [revealedRecoveryCodes, setRevealedRecoveryCodes] = useState<
    string[] | null
  >(null)

  const confirmForm = useForm<ConfirmFormData>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { code: '' },
  })

  const loadSetupData = async (): Promise<SetupData> => {
    const [qr, secret, recoveryCodes] = await Promise.all([
      getTwoFactorQrCode(),
      getTwoFactorSecret(),
      getRecoveryCodes(),
    ])
    return { svg: qr.svg, secretKey: secret.secretKey, recoveryCodes }
  }

  const enableMutation = useMutation({
    mutationFn: async () => {
      await enableTwoFactor()
      return loadSetupData()
    },
    onSuccess: (data) => {
      setSetup(data)
      confirmForm.reset()
    },
    onError: () => {
      toast.error(
        'Die Zwei-Faktor-Authentifizierung konnte nicht gestartet werden. Bitte versuche es erneut.'
      )
    },
  })

  const confirmMutation = useMutation({
    mutationFn: confirmTwoFactor,
    onSuccess: async () => {
      await refreshProfile()
      setSetup(null)
      toast.success('Die Zwei-Faktor-Authentifizierung ist jetzt aktiv.')
    },
    onError: (err) => {
      if (err instanceof ApiValidationError && err.errors?.code) {
        confirmForm.setError('code', {
          message: 'Der Code ist ungültig. Bitte versuche es erneut.',
        })
        return
      }
      toast.error('Der Code konnte nicht bestätigt werden.')
    },
  })

  const disableMutation = useMutation({
    mutationFn: disableTwoFactor,
    onSuccess: async () => {
      await refreshProfile()
      setSetup(null)
      setRevealedRecoveryCodes(null)
      toast.success('Die Zwei-Faktor-Authentifizierung wurde deaktiviert.')
    },
    onError: () => {
      toast.error(
        'Die Zwei-Faktor-Authentifizierung konnte nicht deaktiviert werden.'
      )
    },
  })

  const showRecoveryCodesMutation = useMutation({
    mutationFn: getRecoveryCodes,
    onSuccess: (codes) => setRevealedRecoveryCodes(codes),
    onError: () =>
      toast.error('Die Wiederherstellungscodes konnten nicht geladen werden.'),
  })

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      await regenerateRecoveryCodes()
      return getRecoveryCodes()
    },
    onSuccess: (codes) => {
      setRevealedRecoveryCodes(codes)
      toast.success('Neue Wiederherstellungscodes wurden erstellt.')
    },
    onError: () =>
      toast.error(
        'Die Wiederherstellungscodes konnten nicht neu erstellt werden.'
      ),
  })

  const onConfirm = (data: ConfirmFormData) => {
    // Enrolment already confirmed the password when enabling, so this normally
    // proceeds without a second prompt (the confirmation window is still open).
    void runConfirmed(() => confirmMutation.mutate(data))
  }

  const copyRecoveryCodes = async (codes: string[]) => {
    try {
      await navigator.clipboard.writeText(codes.join('\n'))
      toast.success('Wiederherstellungscodes wurden kopiert.')
    } catch {
      toast.error('Codes konnten nicht kopiert werden.')
    }
  }

  const setupOpen = !!setup && !isEnabled
  const recoveryOpen = isEnabled && !!revealedRecoveryCodes

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Zwei-Faktor-Authentifizierung
          </CardTitle>
          <CardTitleIcon icon={isEnabled ? ShieldCheck : ShieldOff} />
          <CardDescription>
            {isEnabled
              ? 'Dein Konto ist mit Zwei-Faktor-Authentifizierung geschützt. Bei der Anmeldung wird zusätzlich zu deinem Passwort ein Code aus deiner Authentifizierungs-App abgefragt.'
              : 'Aktiviere die Zwei-Faktor-Authentifizierung um die Sicherheit für dein Konto zu verbessern. Wenn aktiviert, benötigst du bei der Anmeldung zusätzlich zu deinem Passwort einen Code aus einer Authentifizierungs-App (z. B. Google Authenticator oder 1Password).'}
          </CardDescription>
        </CardHeader>

        <CardFooter className="flex flex-wrap justify-end gap-2">
          {!isEnabled && (
            <Button
              type="button"
              onClick={() => runConfirmed(() => enableMutation.mutate())}
              disabled={enableMutation.isPending}
            >
              {enableMutation.isPending ? 'Wird gestartet...' : 'Aktivieren'}
            </Button>
          )}

          {isEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  runConfirmed(() => showRecoveryCodesMutation.mutate())
                }
                disabled={showRecoveryCodesMutation.isPending}
              >
                Wiederherstellungscodes anzeigen
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => runConfirmed(() => regenerateMutation.mutate())}
                disabled={regenerateMutation.isPending}
              >
                Neue Codes generieren
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive_outline">
                    Deaktivieren
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Zwei-Faktor-Authentifizierung deaktivieren?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Dein Konto ist danach nur noch mit Passwort geschützt. Du
                      kannst die Zwei-Faktor-Authentifizierung jederzeit wieder
                      aktivieren.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        runConfirmed(() => disableMutation.mutate())
                      }
                      disabled={disableMutation.isPending}
                    >
                      Deaktivieren
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardFooter>
      </Card>

      {/* Enrolment in progress: QR, secret, recovery codes and confirm form. */}
      <Dialog
        open={setupOpen}
        onOpenChange={(next) => {
          // Closing the dialog abandons the pending enrolment.
          if (!next && setup) {
            disableMutation.mutate()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zwei-Faktor-Authentifizierung einrichten</DialogTitle>
            <DialogDescription>
              Verbinde eine Authentifizierungs-App und bestätige den ersten
              Code, um die Zwei-Faktor-Authentifizierung zu aktivieren.
            </DialogDescription>
          </DialogHeader>

          {setup && (
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  1. Scanne den QR-Code mit deiner Authentifizierungs-App
                </p>
                <div
                  className="inline-block rounded-md bg-white p-4"
                  // The QR SVG is generated server-side by Fortify from the
                  // user's own freshly created TOTP secret and returned by the
                  // two-factor-qr-code endpoint — it is first-party, trusted
                  // markup with no user-controlled input, so injecting it here
                  // is not an XSS sink. Sanitising it (or swapping to a
                  // client-side QR renderer) would only add a dependency
                  // without changing the trust boundary.
                  dangerouslySetInnerHTML={{ __html: setup.svg }}
                />
                <p className="text-sm text-muted-foreground">
                  Alternativ kannst du diesen Schlüssel manuell eingeben:
                </p>
                <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-sm">
                  {setup.secretKey}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">
                  2. Speichere deine Wiederherstellungscodes
                </p>
                <Alert>
                  <AlertTitle>Bewahre diese Codes sicher auf</AlertTitle>
                  <AlertDescription>
                    Mit einem Wiederherstellungscode kannst du dich anmelden,
                    wenn du keinen Zugriff auf deine App hast. Jeder Code ist
                    nur einmal gültig.
                  </AlertDescription>
                </Alert>
                <RecoveryCodeList codes={setup.recoveryCodes} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyRecoveryCodes(setup.recoveryCodes)}
                >
                  <Copy className="size-4" />
                  Codes kopieren
                </Button>
              </div>

              <form
                id="form-two-factor-confirm"
                onSubmit={confirmForm.handleSubmit(onConfirm)}
                noValidate
                className="space-y-4"
              >
                <p className="text-sm font-medium">
                  3. Gib den Code aus deiner App ein, um zu bestätigen
                </p>
                <FieldGroup>
                  <TextInput
                    name="code"
                    control={confirmForm.control}
                    label="Bestätigungscode"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </FieldGroup>
              </form>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              form="form-two-factor-confirm"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending
                ? 'Wird bestätigt...'
                : 'Bestätigen und aktivieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery codes revealed for an already-active second factor. */}
      <Dialog
        open={recoveryOpen}
        onOpenChange={(next) => {
          if (!next) {
            setRevealedRecoveryCodes(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wiederherstellungscodes</DialogTitle>
            <DialogDescription>
              Bewahre diese Codes sicher auf. Jeder Code ist nur einmal gültig.
            </DialogDescription>
          </DialogHeader>

          {revealedRecoveryCodes && (
            <div className="space-y-3">
              <RecoveryCodeList codes={revealedRecoveryCodes} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyRecoveryCodes(revealedRecoveryCodes)}
              >
                <Copy className="size-4" />
                Codes kopieren
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {passwordDialog}
    </>
  )
}

function RecoveryCodeList({ codes }: { codes: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-3 font-mono text-sm">
      {codes.map((code) => (
        <code key={code} className="break-all">
          {code}
        </code>
      ))}
    </div>
  )
}
