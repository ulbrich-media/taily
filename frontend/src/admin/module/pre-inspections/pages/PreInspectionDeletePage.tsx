import { useMutation, useQueryClient } from '@tanstack/react-query'
import { preInspectionQueryKeys } from '@/admin/module/pre-inspections/api/queries'
import { deletePreInspection } from '@/admin/module/pre-inspections/api/requests'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
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
import { Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

interface PreInspectionDeletePageProps {
  inspection: PreInspectionResource
  onDeleted: () => void
  onClose: () => void
}

export function PreInspectionDeletePage({
  inspection,
  onDeleted,
  onClose,
}: PreInspectionDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deletePreInspection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: preInspectionQueryKeys.all })
      toast.success(data.message)
      onDeleted()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Vorkontrolle löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du die Vorkontrolle von{' '}
            <span className="font-medium text-foreground">
              {inspection.person.full_name}
            </span>{' '}
            für{' '}
            <span className="font-medium text-foreground">
              {inspection.animal_type.title}
            </span>{' '}
            wirklich löschen? Dieser Vorgang kann nicht rückgängig gemacht
            werden!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutateAsync(inspection.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
