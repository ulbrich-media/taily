import { Trash2Icon } from 'lucide-react'
import type { CatalogueGroup } from '@/api/types/case-file-catalogue'
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
import { deleteFieldGroup } from '../api/requests'
import { useCatalogueMutation } from '../useCatalogueMutation'

interface FieldGroupDeleteDialogProps {
  animalTypeId: string
  group: CatalogueGroup
  onClose: () => void
}

/** Only empty groups can be deleted; fields have to be moved first. */
export function FieldGroupDeleteDialog({
  animalTypeId,
  group,
  onClose,
}: FieldGroupDeleteDialogProps) {
  const mutation = useCatalogueMutation(
    animalTypeId,
    () => deleteFieldGroup(group.id),
    onClose
  )
  const hasFields = group.fields.length > 0

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Abschnitt „{group.title}“ löschen</AlertDialogTitle>
          <AlertDialogDescription>
            {hasFields
              ? 'Der Abschnitt enthält noch Felder (auch archivierte). Verschiebe sie zuerst in einen anderen Abschnitt.'
              : 'Der leere Abschnitt wird entfernt.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          {!hasFields && (
            <AlertDialogAction
              variant="destructive"
              disabled={mutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                mutation.mutate(undefined)
              }}
            >
              {mutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
