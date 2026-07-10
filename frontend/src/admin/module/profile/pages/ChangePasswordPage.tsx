import type { ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogBreadcrumb,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Input } from '@/shadcn/components/ui/input'
import { Button } from '@/shadcn/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field'
import { ApiValidationError } from '@/lib/api'
import { withPasswordConfirmation } from '@/lib/password.schema'
import { updatePassword } from '@/admin/module/profile/api/requests'
import { mapPasswordValidationMessage } from '@/admin/module/profile/api/validationMessages'

const changePasswordSchema = withPasswordConfirmation({
  current_password: z.string().min(1, 'Bitte gib dein aktuelles Passwort ein'),
})

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>

interface ChangePasswordPageProps {
  onClose: () => void
  breadcrumb?: ReactNode
}

export function ChangePasswordPage({
  onClose,
  breadcrumb,
}: ChangePasswordPageProps) {
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

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort ändern</DialogTitle>
          <DialogDescription>Aktualisiere dein Passwort</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <Controller
              name="current_password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Aktuelles Passwort
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    autoComplete="current-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Neues Passwort</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password_confirmation"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Neues Passwort bestätigen
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wird gespeichert...' : 'Passwort ändern'}
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
