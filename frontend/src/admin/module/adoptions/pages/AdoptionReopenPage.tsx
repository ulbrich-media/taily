import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import type { AdoptionDetailResource } from '@/api/types/adoptions'

interface AdoptionReopenPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionReopenPage({
  adoption,
  onClose,
}: AdoptionReopenPageProps) {
  const queryClient = useQueryClient()

  const reopenMutation = useMutation({
    mutationFn: () =>
      updateAdoption(adoption.id, {
        status: 'in_progress',
        canceled_at: null,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vermittlung wiedereröffnet')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Wiedereröffnen der Vermittlung')
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vermittlung wiedereröffnen?</AlertDialogTitle>
          <AlertDialogDescription>
            Die Vermittlung wird wieder als in Bearbeitung markiert und kann
            weiter bearbeitet werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
          >
            {reopenMutation.isPending ? 'Wird geöffnet...' : 'Wiedereröffnen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
