import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personQueryKeys } from '@/admin/module/people/api/queries'
import { deletePerson } from '@/admin/module/people/api/requests'
import type { PersonDetailResource } from '@/api/types/people'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { toast } from 'sonner'

interface PersonDeletePageProps {
  person: PersonDetailResource
  onDeleted: () => void
  onClose: () => void
}

export function PersonDeletePage({
  person,
  onDeleted,
  onClose,
}: PersonDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deletePerson(person.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: personQueryKeys.list })
      toast.success(data.message)
      onDeleted()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Löschen der Person'
      )
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Person löschen</DialogTitle>
          <DialogDescription>
            Bist du sicher, dass du die Person{' '}
            <strong>{person.full_name}</strong> löschen möchtest? Diese Aktion
            kann nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>

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
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Lösche...' : 'Löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
