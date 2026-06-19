import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userQueryKeys } from '@/admin/module/users/api/queries'
import { deleteUser } from '@/admin/module/users/api/requests'
import type { UserResource } from '@/api/types/users'
import { Button } from '@/shadcn/components/ui/button'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
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

interface UserDeletePageProps {
  user: UserResource
  onClose: () => void
}

export function UserDeletePage({ user, onClose }: UserDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Löschen des Benutzers'
      )
    },
  })

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-solo">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du den Benutzer{' '}
            <span className="font-bold">{user.name}</span> (
            <span className="font-bold">{user.email}</span>) wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Abbrechen
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutateAsync(user.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
