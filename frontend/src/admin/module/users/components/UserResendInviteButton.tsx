import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { userQueryKeys } from '@/admin/module/users/api/queries'
import { resendUserInvitation } from '@/admin/module/users/api/requests'
import type { UserResource } from '@/api/types/users'
import { Button } from '@/shadcn/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog.tsx'

interface UserResendInviteButtonProps {
  user: UserResource
}

/**
 * Icon button with a confirmation dialog that sends a new invitation. Only
 * rendered for users who have never logged in (expired or still valid invite).
 */
export function UserResendInviteButton({ user }: UserResendInviteButtonProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: resendUserInvitation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
      toast.success(data.message)
      setOpen(false)
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Senden der Einladung'
      )
    },
  })

  if (user.last_login_at) {
    return null
  }

  return (
    <>
      <Button
        size="icon-sm"
        variant="outline"
        aria-label="Einladung erneut senden"
        title="Einladung erneut senden"
        onClick={() => setOpen(true)}
      >
        <SendIcon />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <SendIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>Einladung erneut senden</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du <span className="font-bold">{user.name}</span> (
              <span className="font-bold">{user.email}</span>) erneut einladen?
              Es wird eine neue Einladungs-E-Mail mit einem neuen Link
              verschickt. Frühere Einladungslinks werden ungültig.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(user.id)}
            >
              {mutation.isPending ? 'Wird gesendet...' : 'Einladung senden'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
