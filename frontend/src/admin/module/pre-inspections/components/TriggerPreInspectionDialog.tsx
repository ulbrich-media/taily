import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { PersonSelect } from '@/components/field/PersonSelect'
import { preInspectionQueryKeys } from '@/admin/module/pre-inspections/api/queries'
import { createPreInspection } from '@/admin/module/pre-inspections/api/requests'
import type { PeopleResponse } from '@/admin/module/people/api/types.ts'

const triggerSchema = z.object({
  inspector_id: z.string().optional().nullable(),
})

type TriggerFormData = z.infer<typeof triggerSchema>

interface TriggerPreInspectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicantId: string
  animalTypeId: string
  inspectors: PeopleResponse
  onCreated: (id: string) => void
}

export function TriggerPreInspectionDialog({
  open,
  onOpenChange,
  applicantId,
  animalTypeId,
  inspectors,
  onCreated,
}: TriggerPreInspectionDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<TriggerFormData>({
    resolver: zodResolver(triggerSchema),
    defaultValues: { inspector_id: null },
  })

  const createMutation = useMutation({
    mutationFn: createPreInspection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: preInspectionQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: preInspectionQueryKeys.listByPersonAndAnimalType(
          applicantId,
          animalTypeId
        ),
      })
      toast.success(data.message)
      onCreated(data.data.id)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  const onSubmit = (data: TriggerFormData) => {
    createMutation.mutate({
      person_id: applicantId,
      animal_type_id: animalTypeId,
      inspector_id: data.inspector_id || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Neue Kontrolle starten
          </DialogTitle>
          <DialogDescription>
            Starte eine neue Vorkontrolle. Du kannst optional einen Kontrolleur
            zuweisen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <PersonSelect
              name="inspector_id"
              control={form.control}
              label="Kontrolleur"
              persons={inspectors}
              renderSubline={(person) =>
                person.inspector_animal_types
                  ? `Kontrollen für ${person.inspector_animal_types.map((animalType) => animalType.title).join(', ')}`
                  : ''
              }
              canRemove
            />
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? 'Erstelle...'
                : 'Vorkontrolle starten'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
