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
import { useAuth } from '@/lib/auth.hook'
import { requestEmailChange } from '@/admin/module/profile/api/requests'

const changeEmailSchema = z.object({
  email: z
    .string()
    .min(1, 'Bitte gib eine E-Mail-Adresse ein')
    .email('Bitte gib eine gültige E-Mail-Adresse ein'),
})

type ChangeEmailFormData = z.infer<typeof changeEmailSchema>

interface ChangeEmailDialogProps {
  open: boolean
  onClose: () => void
}

export function ChangeEmailDialog({ open, onClose }: ChangeEmailDialogProps) {
  const { refreshProfile } = useAuth()

  const form = useForm<ChangeEmailFormData>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: { email: '' },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: requestEmailChange,
    onSuccess: async (response) => {
      toast.success(response.message)
      form.reset()
      await refreshProfile()
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiValidationError && err.errors?.email) {
        form.setError('email', { message: err.errors.email[0] })
        return
      }

      toast.error(
        err instanceof Error
          ? err.message
          : 'Fehler beim Ändern der E-Mail-Adresse. Bitte versuche es erneut.'
      )
    },
  })

  const onSubmit = (data: ChangeEmailFormData) => {
    mutate(data)
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>E-Mail-Adresse ändern</DialogTitle>
          <DialogDescription>
            Wir senden dir einen Bestätigungslink an die neue Adresse. Deine
            aktuelle E-Mail-Adresse bleibt gültig, bis du den Link bestätigst.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <TextInput
              name="email"
              control={form.control}
              label="Neue E-Mail-Adresse"
              type="email"
              autoComplete="email"
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
              {isPending ? 'Wird gesendet...' : 'Bestätigungslink senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
