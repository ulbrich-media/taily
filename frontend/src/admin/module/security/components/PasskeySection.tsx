import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Fingerprint, Trash2 } from 'lucide-react'
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
import { usePasswordConfirmation } from '@/admin/module/security/usePasswordConfirmation'
import { formatApiDate } from '@/lib/dates.utils'
import { deletePasskey } from '@/admin/module/security/api/requests'
import { listPasskeysQuery } from '@/admin/module/security/api/queries'
import type { Passkey } from '@/admin/module/security/api/types'
import {
  Passkeys,
  PASSKEY_REGISTER_ROUTES,
  type PasskeyError,
} from '@/lib/passkeys'

const registerSchema = z.object({
  name: z.string().min(1, 'Bitte gib deinem Passkey einen Namen').max(255),
})

type RegisterFormData = z.infer<typeof registerSchema>

interface PasskeySectionProps {
  passkeys: Passkey[]
}

/**
 * Security page section for passkeys (WebAuthn). Registering and deleting a
 * passkey are gated server-side behind a fresh password confirmation, same as
 * two-factor authentication management. The list itself is resolved by the
 * route and passed down as a prop; this component never fetches it.
 */
export function PasskeySection({ passkeys }: PasskeySectionProps) {
  const queryClient = useQueryClient()
  const { ensureConfirmed, dialog: passwordDialog } = usePasswordConfirmation()

  const [registerOpen, setRegisterOpen] = useState(false)

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '' },
  })

  const registerMutation = useMutation<
    Awaited<ReturnType<typeof Passkeys.register>>,
    PasskeyError,
    RegisterFormData
  >({
    mutationFn: async ({ name }) =>
      Passkeys.register({ name, routes: PASSKEY_REGISTER_ROUTES }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listPasskeysQuery.queryKey,
      })
      setRegisterOpen(false)
      registerForm.reset()
      toast.success('Passkey wurde hinzugefügt.')
    },
    onError: (err) => {
      toast.error(err.message || 'Der Passkey konnte nicht erstellt werden.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deletePasskey,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: listPasskeysQuery.queryKey,
      })
      toast.success('Passkey wurde entfernt.')
    },
    onError: () => {
      toast.error('Der Passkey konnte nicht entfernt werden.')
    },
  })

  const openRegisterDialog = async () => {
    if (await ensureConfirmed()) {
      registerForm.reset()
      setRegisterOpen(true)
    }
  }

  const onRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data)
  }

  const onDelete = (passkey: Passkey) => {
    void (async () => {
      if (await ensureConfirmed()) {
        deleteMutation.mutate(passkey.id)
      }
    })()
  }

  return (
    <>
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Passkeys</CardTitle>
          <CardTitleIcon icon={Fingerprint} />
          <CardDescription>
            Melde dich ohne Passwort an — mit Face ID, Touch ID, Windows Hello
            oder einem Sicherheitsschlüssel. Ein Passkey ist an dieses Gerät
            gebunden und schützt vor Phishing.
          </CardDescription>
        </CardHeader>

        {passkeys.length > 0 && (
          <div className="px-6">
            <ul className="divide-y rounded-md border">
              {passkeys.map((passkey) => (
                <li
                  key={passkey.id}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {passkey.name}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {passkey.authenticator
                        ? `${passkey.authenticator} · `
                        : ''}
                      {passkey.last_used_at
                        ? `Zuletzt verwendet am ${formatApiDate(passkey.last_used_at)}`
                        : 'Noch nicht verwendet'}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Passkey entfernen"
                      >
                        <Trash2 />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Passkey entfernen?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{passkey.name}" kann danach nicht mehr für die
                          Anmeldung verwendet werden.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(passkey)}
                          disabled={deleteMutation.isPending}
                        >
                          Entfernen
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </li>
              ))}
            </ul>
          </div>
        )}

        <CardFooter className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            onClick={() => void openRegisterDialog()}
            disabled={registerMutation.isPending}
          >
            Passkey hinzufügen
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passkey hinzufügen</DialogTitle>
            <DialogDescription>
              Gib deinem Passkey einen Namen, der dir hilft ihn später
              wiederzuerkennen, und folge dann den Anweisungen deines Geräts.
            </DialogDescription>
          </DialogHeader>

          <form
            id="form-passkey-register"
            onSubmit={registerForm.handleSubmit(onRegister)}
            noValidate
          >
            <FieldGroup>
              <TextInput
                name="name"
                control={registerForm.control}
                label="Name (z. B. MacBook Pro)"
                autoFocus
              />
            </FieldGroup>
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegisterOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              form="form-passkey-register"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending
                ? 'Wird hinzugefügt...'
                : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {passwordDialog}
    </>
  )
}
