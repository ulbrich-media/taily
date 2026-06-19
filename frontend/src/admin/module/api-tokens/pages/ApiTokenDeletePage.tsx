import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTokenQueryKeys } from '@/admin/module/api-tokens/api/queries.ts'
import { deleteApiToken } from '@/admin/module/api-tokens/api/requests.ts'
import type { ApiTokenResource } from '@/api/types/api-tokens'
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

interface ApiTokenResourceDeletePageProps {
  token: ApiTokenResource
  onClose: () => void
}

export function ApiTokenDeletePage({
  token,
  onClose,
}: ApiTokenResourceDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: deleteApiToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiTokenQueryKeys.list })
      toast.success('Token wurde gelöscht')
      onClose()
    },
  })

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Token löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du das Token{' '}
            <span className="font-bold">{token.name}</span> wirklich löschen?
            Dieser Vorgang kann nicht rückgängig gemacht werden. Das Token
            verliert dabei sofort seine Gültigkeit.
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
            onClick={() => deleteMutation.mutateAsync(token.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
