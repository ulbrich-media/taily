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
import { TextInput } from '@/components/field/TextInput'
import { FieldGroup } from '@/shadcn/components/ui/field'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils'
import {
  toApiDate,
  zFieldDateNoPast,
} from '@/components/field/DateInput.utils.ts'
import { PersonSelect } from '@/components/field/PersonSelect'
import type { PersonListResource } from '@/api/types/people'

const schema = z.object({
  name: zFieldString({ maxLength: 255 }),
  planned_at: zFieldDateNoPast,
  notes: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
  responsible_id: z.string().nullable(),
  transporter: zFieldString({ maxLength: 255 }),
})

type FormData = z.infer<typeof schema>

interface TransportCreateDialogProps {
  mediators: PersonListResource[]
  onCreated: (id: string) => void
  onClose: () => void
}

export function TransportCreateDialog({
  mediators,
  onCreated,
  onClose,
}: TransportCreateDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      planned_at: null,
      notes: '',
      responsible_id: null,
      transporter: '',
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
              name: data.name,
              planned_at: toApiDate(data.planned_at),
              notes: data.notes,
              responsible_id: data.responsible_id,
              transporter: data.transporter,
            })
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <TextInput name="name" control={form.control} label="Name" />
          </FieldGroup>
          <FieldGroup>
            <DateInput
              name="planned_at"
              control={form.control}
              label="Geplantes Datum"
              disablePastDates
            />
          </FieldGroup>
          <FieldGroup>
            <PersonSelect
              name="responsible_id"
              control={form.control}
              label="Verantwortliche Person"
              persons={mediators}
              renderSubline={(person) =>
                person.mediator_animal_types
                  ? `Vermittlung für ${person.mediator_animal_types.map((animalType) => animalType.title).join(', ')}`
                  : ''
              }
              canRemove
            />
          </FieldGroup>
          <FieldGroup>
            <TextInput
              name="transporter"
              control={form.control}
              label="Transporteur"
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
