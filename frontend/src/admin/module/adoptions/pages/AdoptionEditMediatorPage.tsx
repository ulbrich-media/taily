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
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { PersonSelect } from '@/components/field/PersonSelect.tsx'
import { z } from 'zod'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import type { PersonListResource } from '@/api/types/people'

const schema = z.object({
  mediator_id: z.string().nullable(),
})

type FormData = z.infer<typeof schema>

interface AdoptionEditMediatorPageProps {
  adoption: AdoptionDetailResource
  persons: PersonListResource[]
  onClose: () => void
}

export function AdoptionEditMediatorPage({
  adoption,
  persons,
  onClose,
}: AdoptionEditMediatorPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediator_id: adoption.mediator_id,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        mediator_id: data.mediator_id,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vermittlung erfolgreich aktualisiert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Vermittlung')
    },
  })

  const handleSubmit = (data: FormData) => {
    updateMutation.mutate(data)
  }

  return (
    <Dialog
      open
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vermittler ändern</DialogTitle>
          <DialogDescription>
            Weise diese Vermittlung einem Vermittler zu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <PersonSelect
            name="mediator_id"
            control={form.control}
            label="Vermittler"
            persons={persons}
            canRemove
          />
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
