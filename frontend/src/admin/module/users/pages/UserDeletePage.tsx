import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userQueryKeys } from '@/admin/module/users/api/queries'
import { deleteUser } from '@/admin/module/users/api/requests'
import type { UserResource } from '@/api/types/users'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

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
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            Benutzer löschen
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="leading-7 mb-2">
            Möchtest du den Benutzer{' '}
            <span className="font-medium">{user.name}</span> (
            <span className="font-medium">{user.email}</span>) wirklich löschen?
          </div>
          <div className="leading-7 mb-2">
            Dieser Vorgang kann nicht rückgängig gemacht werden.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutateAsync(user.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
