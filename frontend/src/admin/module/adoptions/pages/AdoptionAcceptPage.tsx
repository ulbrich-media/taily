import { type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBreadcrumb,
} from '@/shadcn/components/ui/dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { acceptAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { getDefaultMediatorId } from '@/admin/module/adoptions/adoption-accept.utils.ts'
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

interface AdoptionAcceptPageProps {
  adoption: AdoptionDetailResource
  mediators: PersonListResource[]
  currentPersonId?: string | null
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AdoptionAcceptPage({
  adoption,
  mediators,
  currentPersonId,
  onClose,
  breadcrumb,
}: AdoptionAcceptPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediator_id: getDefaultMediatorId(
        currentPersonId,
        mediators,
        adoption.mediator_id
      ),
    },
  })

  const acceptMutation = useMutation({
    mutationFn: (data: FormData) =>
      acceptAdoption(adoption.id, { mediator_id: data.mediator_id }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Bewerbung angenommen')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Annehmen der Bewerbung')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vermittler festlegen</DialogTitle>
          <DialogDescription>
            Die Bewerbung wird angenommen und die Vermittlung geht in
            Bearbeitung. Ein bereits zugewiesener Vermittler wird ersetzt.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => acceptMutation.mutate(data))}
          className="space-y-4"
        >
          <PersonSelect
            name="mediator_id"
            control={form.control}
            label="Vermittler"
            persons={mediators}
            renderSubline={(person) =>
              person.mediator_animal_types
                ? `Vermittlung für ${person.mediator_animal_types.map((animalType) => animalType.title).join(', ')}`
                : ''
            }
            canRemove
          />
          <DialogFooter>
            <Button type="submit" disabled={acceptMutation.isPending}>
              Annehmen
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
