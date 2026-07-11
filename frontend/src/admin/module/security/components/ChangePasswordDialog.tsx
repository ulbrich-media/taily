import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Input } from '@/shadcn/components/ui/input'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { ApiValidationError } from '@/lib/api'
import { withPasswordConfirmation } from '@/lib/password.schema'
import { updatePassword } from '@/admin/module/security/api/requests'
import { mapPasswordValidationMessage } from '@/lib/password.messages'

const changePasswordSchema = withPasswordConfirmation({
  current_password: z.string().min(1, 'Bitte gib dein aktuelles Passwort ein'),
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangePasswordDialog({
  open,
  onClose,
}: ChangePasswordDialogProps) {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: updatePassword,
    onSuccess: (response) => {
      toast.success(response.message)
      form.reset()
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiValidationError && err.errors) {
        if (err.errors.current_password) {
          form.setError('current_password', {
            message: mapPasswordValidationMessage(
              err.errors.current_password[0]
            ),
          })
        }
        if (err.errors.password) {
          form.setError('password', {
            message: mapPasswordValidationMessage(err.errors.password[0]),
          })
        }
        if (!err.errors.current_password && !err.errors.password) {
          toast.error(err.message)
        }
        return
      }

      toast.error(
        err instanceof Error
          ? err.message
          : 'Fehler beim Ändern des Passworts. Bitte versuche es erneut.'
      )
    },
  })

  const onSubmit = (data: ChangePasswordFormData) => {
    mutate(data)
  }

  // Clear the typed passwords on every close path (Escape, backdrop, Abbrechen)
  // so they are not still present when the dialog is reopened.
  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>Aktualisiere dein Passwort</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <FormFieldWrapper
              name="current_password"
              control={form.control}
              label="Aktuelles Passwort"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  type="password"
                  autoComplete="current-password"
                />
              )}
            />

            <FormFieldWrapper
              name="password"
              control={form.control}
              label="Neues Passwort"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            />

            <FormFieldWrapper
              name="password_confirmation"
              control={form.control}
              label="Neues Passwort bestätigen"
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wird gespeichert...' : 'Passwort ändern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
