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
        canceled_reason: '',
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vermittlung fortgesetzt')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Fortsetzen der Vermittlung')
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Vermittlung fortsetzen?</AlertDialogTitle>
          <AlertDialogDescription>
            Die Vermittlung wird dort fortgesetzt, wo sie abgebrochen wurde.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
          >
            {reopenMutation.isPending ? 'Wird fortgesetzt...' : 'Fortsetzen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
