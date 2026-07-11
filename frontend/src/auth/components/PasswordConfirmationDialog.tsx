import { useEffect } from 'react'
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
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { TextInput } from '@/components/field/TextInput'
import { ApiValidationError } from '@/lib/api'
import { confirmPassword } from '@/lib/password-confirmation.api'

const schema = z.object({
  password: z.string().min(1, 'Bitte gib dein Passwort ein'),
})

type FormData = z.infer<typeof schema>

interface PasswordConfirmationDialogProps {
  open: boolean
  onConfirmed: () => void
  onCancel: () => void
}

/**
 * Re-authentication prompt shown before a sensitive action. On success it calls
 * `onConfirmed`; the caller then proceeds with the action it was guarding.
 */
export function PasswordConfirmationDialog({
  open,
  onConfirmed,
  onCancel,
}: PasswordConfirmationDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '' },
  })

  // Clear any previously typed password whenever the dialog is reopened.
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => confirmPassword(data.password),
    onSuccess: () => {
      form.reset()
      onConfirmed()
    },
    onError: (err) => {
      if (err instanceof ApiValidationError && err.errors?.password) {
        form.setError('password', {
          message: 'Das Passwort ist falsch.',
        })
        return
      }
      toast.error('Das Passwort konnte nicht bestätigt werden.')
    },
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwort bestätigen</DialogTitle>
          <DialogDescription>
            Bitte bestätige zur Sicherheit dein Passwort, um fortzufahren.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((data) => mutate(data))}
          className="space-y-4"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Wird bestätigt...' : 'Bestätigen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
