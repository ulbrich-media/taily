import { useMutation, useQueryClient } from '@tanstack/react-query'
import { vaccinationQueryKeys } from '@/admin/module/vaccinations/api/queries'
import { deleteVaccination } from '@/admin/module/vaccinations/api/requests'
import type { VaccinationResource } from '@/api/types/vaccinations'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog.tsx'
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
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            Impfung löschen
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="leading-7 mb-2">
            Möchtest du die Impfung{' '}
            <span className="font-medium">{vaccination.title}</span> für{' '}
            <span className="font-medium">{vaccination.animal_type.title}</span>{' '}
            wirklich löschen?
          </div>
          <div className="leading-7 mb-2">
            Dieser Vorgang kann nicht rückgängig gemacht werden. Alle
            Impfeinträge der Tiere für diese Impfung werden ebenfalls gelöscht.
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
            onClick={() => deleteMutation.mutateAsync(vaccination.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
