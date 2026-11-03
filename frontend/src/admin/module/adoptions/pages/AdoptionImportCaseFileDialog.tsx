import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CopyPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { RelatedAdoption } from '@/api/types/adoptions'
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
import { formatApiDate } from '@/lib/dates.utils'
import { importCaseFile } from '@/admin/module/case-file/api/requests'
import { caseFileQueryKeys } from '@/admin/module/case-file/api/queries'
import { adoptionQueryKeys } from '../api/queries'

interface AdoptionImportCaseFileDialogProps {
  adoptionId: string
  source: RelatedAdoption
  onClose: () => void
}

/**
 * Takes over the values of an earlier adoption of the same applicant. Only
 * empty fields are filled; nothing is overwritten (ADR-017).
 */
export function AdoptionImportCaseFileDialog({
  adoptionId,
  source,
  onClose,
}: AdoptionImportCaseFileDialogProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => importCaseFile(adoptionId, source.id),
    onSuccess: (response) => {
      queryClient.setQueryData(
        caseFileQueryKeys.detail(adoptionId),
        response.data
      )
      // Built-in fields are the adoption's applicant columns.
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoptionId),
      })
      toast.success(response.message)
      onClose()
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <CopyPlus />
          </AlertDialogMedia>
          <AlertDialogTitle>Angaben übernehmen</AlertDialogTitle>
          <AlertDialogDescription>
            Übernimmt die Angaben aus der Vermittlung von{' '}
            {source.animal?.name ?? 'einem Tier'} vom{' '}
            {formatApiDate(source.created_at)}. Nur Felder, die hier noch leer
            sind, werden ausgefüllt – nichts wird überschrieben. Angaben, die
            geprüft werden müssen, müssen erneut geprüft werden.
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
              mutation.mutate()
            }}
          >
            Übernehmen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
