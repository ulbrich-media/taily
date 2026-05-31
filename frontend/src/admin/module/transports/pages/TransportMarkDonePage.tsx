import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markTransportDone } from '@/admin/module/transports/api/requests'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { toast } from 'sonner'
import type { TransportListResource } from '@/api/types/transports'

interface TransportMarkDonePageProps {
  transport: TransportListResource
  onClose: () => void
}

export function TransportMarkDonePage({
  transport,
  onClose,
}: TransportMarkDonePageProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => markTransportDone(transport.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all })
      toast.success(response.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Abschließen des Transports')
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transport abschließen</AlertDialogTitle>
          <AlertDialogDescription>
            Der Transport wird als abgeschlossen markiert. Diese Aktion kann
            nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Wird gespeichert...' : 'Ja, abschließen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
