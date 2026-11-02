import { Archive, ArchiveRestore } from 'lucide-react'
import type { CatalogueField } from '@/api/types/case-file-catalogue'
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
import { archiveFieldDefinition, restoreFieldDefinition } from '../api/requests'
import { useCatalogueMutation } from '../useCatalogueMutation'

interface FieldArchiveDialogProps {
  animalTypeId: string
  field: CatalogueField
  onClose: () => void
}

/**
 * Fields are archived, never deleted: existing values stay on the adoptions
 * that have them, but the field is no longer asked or required.
 */
export function FieldArchiveDialog({
  animalTypeId,
  field,
  onClose,
}: FieldArchiveDialogProps) {
  const archived = !!field.archived_at
  const mutation = useCatalogueMutation(
    animalTypeId,
    () =>
      archived
        ? restoreFieldDefinition(field.id)
        : archiveFieldDefinition(field.id),
    onClose
  )

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            {archived ? <ArchiveRestore /> : <Archive />}
          </AlertDialogMedia>
          <AlertDialogTitle>
            „{field.label}“ {archived ? 'wiederherstellen' : 'archivieren'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archived
              ? 'Das Feld wird wieder erfragt und gilt sofort für alle laufenden Vermittlungen.'
              : 'Das Feld wird nicht mehr erfragt und nicht mehr verlangt. Bereits erfasste Angaben bleiben bei den Vermittlungen erhalten.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Abbrechen
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault()
              mutation.mutate(undefined)
            }}
          >
            {archived ? 'Wiederherstellen' : 'Archivieren'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
