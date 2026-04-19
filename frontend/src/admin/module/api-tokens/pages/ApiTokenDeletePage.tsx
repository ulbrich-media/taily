import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiTokenQueryKeys } from '@/admin/module/api-tokens/api/queries.ts'
import { deleteApiToken } from '@/admin/module/api-tokens/api/requests.ts'
import type { ApiTokenResource } from '@/api/types/api-tokens'
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2Icon className="h-5 w-5 text-destructive" />
            Token löschen
          </DialogTitle>
        </DialogHeader>

        <div>
          <div className="leading-7 mb-2">
            Möchtest du das Token{' '}
            <span className="font-medium">{token.name}</span> wirklich löschen?
          </div>
          <div className="leading-7 mb-2">
            Dieser Vorgang kann nicht rückgängig gemacht werden. Das Token
            verliert dabei sofort seine Gültigkeit.
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
            onClick={() => deleteMutation.mutateAsync(token.id)}
          >
            {deleteMutation.isPending ? 'Wird gelöscht...' : 'Ja, löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
