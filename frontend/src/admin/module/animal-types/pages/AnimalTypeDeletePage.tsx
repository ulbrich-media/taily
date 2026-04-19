import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { deleteAnimalType } from '@/admin/module/animal-types/api/requests'
import type { AnimalTypeResource } from '@/api/types/animal-types'
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            Tierart löschen
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="leading-7 mb-2">
            Möchtest du die Tierart{' '}
            <span className="font-medium">{animalType.title}</span> wirklich
            löschen?
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
            onClick={() => deleteMutation.mutateAsync(animalType.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
