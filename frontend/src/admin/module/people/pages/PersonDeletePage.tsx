import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { personQueryKeys } from '@/admin/module/people/api/queries'
import { deletePerson } from '@/admin/module/people/api/requests'
import type { PersonDetailResource } from '@/api/types/people'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
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
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Person löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Bist du sicher, dass du die Person{' '}
            <span className="font-bold">{person.full_name}</span> löschen
            möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
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
            type="button"
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Lösche...' : 'Löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
