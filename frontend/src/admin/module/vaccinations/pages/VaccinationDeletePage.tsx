import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vaccinationQueryKeys } from '@/admin/module/vaccinations/api/queries'
import { deleteVaccination } from '@/admin/module/vaccinations/api/requests'
import type { VaccinationResource } from '@/api/types/vaccinations'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

interface VaccinationDeletePageProps {
  vaccination: VaccinationResource
  onClose: () => void
}

export function VaccinationDeletePage({
  vaccination,
  onClose,
}: VaccinationDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteVaccination,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vaccinationQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Impfung')
    },
  })

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-text">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Impfung löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du die Impfung{' '}
            <span className="font-bold">{vaccination.title}</span> für{' '}
            <span className="font-bold">{vaccination.animal_type.title}</span>{' '}
            wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht
            werden. Alle Impfeinträge der Tiere für diese Impfung werden
            ebenfalls gelöscht.
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
            onClick={() => deleteMutation.mutate(vaccination.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
