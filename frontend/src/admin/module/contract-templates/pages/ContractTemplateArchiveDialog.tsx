import { Archive, ArchiveRestore } from 'lucide-react'
import type { ContractTemplateResource } from '@/api/types/contract-templates'
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
import {
  archiveContractTemplate,
  restoreContractTemplate,
} from '../api/requests'
import { useContractTemplateMutation } from '../useContractTemplateMutation'

interface ContractTemplateArchiveDialogProps {
  template: ContractTemplateResource
  onClose: () => void
}

/**
 * Templates are archived, never deleted: contracts made with them stay
 * traceable.
 */
export function ContractTemplateArchiveDialog({
  template,
  onClose,
}: ContractTemplateArchiveDialogProps) {
  const archived = !!template.archived_at
  const mutation = useContractTemplateMutation(
    () =>
      archived
        ? restoreContractTemplate(template.id)
        : archiveContractTemplate(template.id),
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
            „{template.name}“ {archived ? 'wiederherstellen' : 'archivieren'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {archived
              ? 'Die Vorlage wird wieder angeboten, und ihre Pflichtfelder gelten sofort für alle laufenden Vermittlungen der Tierarten.'
              : 'Die Vorlage wird nicht mehr angeboten und verlangt keine Felder mehr. Bereits erzeugte Verträge bleiben unverändert.'}
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
