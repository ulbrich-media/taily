import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { deleteAnimalType } from '@/admin/module/animal-types/api/requests'
import type { AnimalTypeResource } from '@/api/types/animal-types'
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
import { Trash2Icon } from 'lucide-react'

interface AnimalTypeDeletePageProps {
  animalType: AnimalTypeResource
  onClose: () => void
}

export function AnimalTypeDeletePage({
  animalType,
  onClose,
}: AnimalTypeDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteAnimalType,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: animalTypeQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-solo">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Tierart löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du die Tierart{' '}
            <span className="font-bold">{animalType.title}</span> wirklich
            löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.
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
            onClick={() => deleteMutation.mutateAsync(animalType.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
