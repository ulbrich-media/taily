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
import { cancelContractSigning } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import type { AdoptionDetailResource } from '@/api/types/adoptions'

interface AdoptionCancelContractSigningPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionCancelContractSigningPage({
  adoption,
  onClose,
}: AdoptionCancelContractSigningPageProps) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: () => cancelContractSigning(adoption.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Signaturvorgang abgebrochen')
      onClose()
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler beim Abbrechen des Signaturvorgangs')
    },
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Signaturvorgang abbrechen?</AlertDialogTitle>
          <AlertDialogDescription>
            Der laufende Signaturvorgang wird abgebrochen. Bereits versendete
            Links werden ungültig. Falls der Adoptant noch unterschreiben
            musste, wird er per E-Mail über den Abbruch informiert.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zurück</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Wird abgebrochen...' : 'Abbrechen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
