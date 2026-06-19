import { useMutation, useQueryClient } from '@tanstack/react-query'
import { medicalTestQueryKeys } from '@/admin/module/medical-tests/api/queries'
import { deleteMedicalTest } from '@/admin/module/medical-tests/api/requests'
import type { MedicalTestResource } from '@/api/types/medical-tests'
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
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-text">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Test löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du den Test{' '}
            <span className="font-bold">{medicalTest.title}</span> für{' '}
            <span className="font-bold">{medicalTest.animal_type.title}</span>{' '}
            wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht
            werden. Alle Testergebnisse der Tiere für diesen Test werden
            ebenfalls gelöscht.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(medicalTest.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
