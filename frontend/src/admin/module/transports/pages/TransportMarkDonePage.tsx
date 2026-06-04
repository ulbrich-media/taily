import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shadcn/components/ui/dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { markTransportDone } from '@/admin/module/transports/api/requests'
import { transportQueryKeys } from '@/admin/module/transports/api/queries'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button'
import { DateInput } from '@/components/field/DateInput'
import { FieldGroup } from '@/shadcn/components/ui/field'
import type { TransportListResource } from '@/api/types/transports'
import {
  toApiDate,
  toDateFieldValue,
  zFieldDateNoFuture,
} from '@/components/field/DateInput.utils.ts'
import { format } from 'date-fns'

const schema = z.object({
  done_at: zFieldDateNoFuture,
})

type FormData = z.infer<typeof schema>

interface TransportMarkDonePageProps {
  transport: TransportListResource
  onClose: () => void
}

export function TransportMarkDonePage({
  transport,
  onClose,
}: TransportMarkDonePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      done_at: toDateFieldValue(format(new Date(), 'yyyy-MM-dd')),
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      markTransportDone(transport.id, { done_at: toApiDate(data.done_at) }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.list() })
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all })
      toast.success(response.message)
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Abschließen des Transports')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transport abschließen</DialogTitle>
          <DialogDescription>
            Der Transport wird als abgeschlossen markiert. Diese Aktion kann
            nicht rückgängig gemacht werden.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <DateInput
              name="done_at"
              control={form.control}
              label="Abgeschlossen am"
              disableFutureDates
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
              {mutation.isPending ? 'Wird gespeichert...' : 'Ja, abschließen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
