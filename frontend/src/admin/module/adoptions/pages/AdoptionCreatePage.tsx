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
import { createAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { AnimalSelect } from '@/components/field/AnimalSelect.tsx'
import { PersonSelect } from '@/components/field/PersonSelect.tsx'
import { z } from 'zod'
import type { AnimalListResource } from '@/api/types/animals'
import type { PersonListResource } from '@/api/types/people'

const adoptionCreateSchema = z.object({
  animal_id: z.string().min(1, 'Pflichtfeld'),
  applicant_id: z.string().min(1, 'Pflichtfeld'),
  mediator_id: z.string().nullable(),
})

type AdoptionCreateData = z.infer<typeof adoptionCreateSchema>

interface AdoptionCreatePageProps {
  animals: AnimalListResource[]
  persons: PersonListResource[]
  mediators: PersonListResource[]
  onCreated: (id: string) => void
  onClose: () => void
}

export function AdoptionCreatePage({
  animals,
  persons,
  mediators,
  onCreated,
  onClose,
}: AdoptionCreatePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<AdoptionCreateData>({
    resolver: zodResolver(adoptionCreateSchema),
    defaultValues: {
      animal_id: '',
      applicant_id: '',
      mediator_id: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: createAdoption,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      toast.success(response.message || 'Vermittlung erfolgreich erstellt')
      onCreated(response.data.id)
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Vermittlung')
    },
  })

  const handleSubmit = (data: AdoptionCreateData) => {
    createMutation.mutate({
      animal_id: data.animal_id,
      applicant_id: data.applicant_id,
      mediator_id: data.mediator_id,
    })
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
          <DialogTitle>Neue Vermittlung</DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Vermittlungsvorgang für ein Tier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <AnimalSelect
            name="animal_id"
            control={form.control}
            label="Tier"
            animals={animals}
            required
          />
          <PersonSelect
            name="applicant_id"
            control={form.control}
            label="Interessent"
            persons={persons}
            required
          />
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
            <Button type="submit" disabled={createMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
