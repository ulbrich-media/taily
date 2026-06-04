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
import { updateTransport } from '@/admin/module/transports/api/requests'
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
import { formatApiDate } from '@/lib/dates.utils'
import type { TransportListResource } from '@/api/types/transports'
import {
  toApiDate,
  toDateFieldValue,
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

interface TransportEditPageProps {
  transport: TransportListResource
  mediators: PersonListResource[]
  onClose: () => void
}

export function TransportEditPage({
  transport,
  mediators,
  onClose,
}: TransportEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: transport.name,
      planned_at: toDateFieldValue(transport.planned_at),
      notes: transport.notes,
      responsible_id: transport.responsible_id,
      transporter: transport.transporter,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateTransport(transport.id, {
        name: data.name,
        planned_at: toApiDate(data.planned_at),
        notes: data.notes,
        responsible_id: data.responsible_id,
        transporter: data.transporter,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      toast.success(response.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Speichern des Transports')
    },
  })

  const title = transport.planned_at
    ? `Transport am ${formatApiDate(transport.planned_at)} bearbeiten`
    : 'Transport bearbeiten'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
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
              disabled={mutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
