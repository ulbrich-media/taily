import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Trash2Icon } from 'lucide-react'
import type { CustomFieldGroupResource } from '@/api/types/custom-fields'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { Button } from '@/shadcn/components/ui/button'
import { formTemplateQueryKeys } from '@/admin/module/form-templates/api/queries'
import { customFieldQueryKeys } from '../api/queries'
import { deleteCustomFieldGroup } from '../api/requests'
import { isCustomFieldRemovalCancelled } from '../custom-field-removal'
import { useCustomFieldRemovalConfirm } from '../useCustomFieldRemovalConfirm'

interface CustomFieldGroupDeletePageProps {
  group: CustomFieldGroupResource
  onClose: () => void
}

export function CustomFieldGroupDeletePage({
  group,
  onClose,
}: CustomFieldGroupDeletePageProps) {
  const queryClient = useQueryClient()
  const removal = useCustomFieldRemovalConfirm()

  const deleteMutation = useMutation({
    mutationFn: () =>
      removal.run((confirm) => deleteCustomFieldGroup(group.id, confirm)),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: customFieldQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: formTemplateQueryKeys.all })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      if (isCustomFieldRemovalCancelled(error)) return
      toast.error(error.message)
    },
  })

  return (
    <>
      <AlertDialog open={!removal.isConfirming} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="text-destructive-text">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Zusatzfelder löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Feldgruppe{' '}
              <span className="font-bold">{group.title}</span> wirklich löschen?
              Die Formularvorlage bleibt erhalten.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Abbrechen
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {removal.dialog}
    </>
  )
}
