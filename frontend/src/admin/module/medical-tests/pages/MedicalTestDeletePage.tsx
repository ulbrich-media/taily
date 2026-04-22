import { useMutation, useQueryClient } from '@tanstack/react-query'
import { medicalTestQueryKeys } from '@/admin/module/medical-tests/api/queries'
import { deleteMedicalTest } from '@/admin/module/medical-tests/api/requests'
import type { MedicalTestResource } from '@/api/types/medical-tests'
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

interface MedicalTestDeletePageProps {
  medicalTest: MedicalTestResource
  onClose: () => void
}

export function MedicalTestDeletePage({
  medicalTest,
  onClose,
}: MedicalTestDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteMedicalTest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: medicalTestQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Löschen des Tests')
    },
  })

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            Test löschen
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="leading-7 mb-2">
            Möchtest du den Test{' '}
            <span className="font-medium">{medicalTest.title}</span> für{' '}
            <span className="font-medium">{medicalTest.animal_type.title}</span>{' '}
            wirklich löschen?
          </div>
          <div className="leading-7 mb-2">
            Dieser Vorgang kann nicht rückgängig gemacht werden. Alle
            Testergebnisse der Tiere für diesen Test werden ebenfalls gelöscht.
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
            onClick={() => deleteMutation.mutate(medicalTest.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
