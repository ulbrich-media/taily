import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTransport } from '@/admin/module/transports/api/requests'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import { toast } from 'sonner'
import type { TransportListResource } from '@/api/types/transports'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { Trash2 } from 'lucide-react'

interface TransportDeletePageProps {
  transport: TransportListResource
  onClose: () => void
}

export function TransportDeletePage({
  transport,
  onClose,
}: TransportDeletePageProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteTransport(transport.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all })
      toast.success(response.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Transports')
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-solo">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Transport löschen</AlertDialogTitle>
          <AlertDialogDescription>
            {transport.adoptions.length > 0
              ? `Dieser Transport ist bei ${transport.adoptions.length} Vermittlung${transport.adoptions.length !== 1 ? 'en' : ''} hinterlegt. Diese werden vom Transport getrennt.`
              : 'Soll dieser Transport wirklich gelöscht werden?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Löschen...' : 'Ja, löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
