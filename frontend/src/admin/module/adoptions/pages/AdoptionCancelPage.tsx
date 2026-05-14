import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Textarea } from '@/components/field/Textarea.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'

const schema = z.object({
  canceled_reason: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
})

type FormData = z.infer<typeof schema>

interface AdoptionCancelPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionCancelPage({
  adoption,
  onClose,
}: AdoptionCancelPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { canceled_reason: '' },
  })

  const cancelMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        canceled_reason: data.canceled_reason.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vermittlung abgebrochen')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Abbrechen der Vermittlung')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vermittlung abbrechen</DialogTitle>
          <DialogDescription>
            Diese Vermittlung wird als abgebrochen markiert. Bitte dokumentiere
            den Grund für den Abbruch.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => cancelMutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <Textarea
              name="canceled_reason"
              control={form.control}
              label="Grund für den Abbruch"
              rows={4}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={cancelMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending
                ? 'Wird abgebrochen...'
                : 'Vermittlung abbrechen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
