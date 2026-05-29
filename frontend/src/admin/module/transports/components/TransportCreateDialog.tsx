import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createTransport } from '@/admin/module/transports/api/requests'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button'
import { Textarea } from '@/components/field/Textarea'
import { DateInput } from '@/components/field/DateInput'
import { FieldGroup } from '@/shadcn/components/ui/field'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils'

const schema = z.object({
  planned_at: z.string().nullable(),
  notes: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
})

type FormData = z.infer<typeof schema>

interface TransportCreateDialogProps {
  onCreated: (id: string) => void
  onClose: () => void
}

export function TransportCreateDialog({
  onCreated,
  onClose,
}: TransportCreateDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      planned_at: null,
      notes: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createTransport,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      toast.success(response.message)
      onCreated(response.data.id)
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Transports')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transport anlegen</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) =>
            createMutation.mutate({
              planned_at: data.planned_at,
              notes: data.notes,
            })
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <DateInput
              name="planned_at"
              control={form.control}
              label="Geplantes Datum"
            />
          </FieldGroup>
          <FieldGroup>
            <Textarea
              name="notes"
              control={form.control}
              label="Notizen"
              rows={4}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
