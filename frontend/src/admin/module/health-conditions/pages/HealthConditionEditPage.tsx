import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { healthConditionQueryKeys } from '@/admin/module/health-conditions/api/queries.ts'
import { updateHealthCondition } from '@/admin/module/health-conditions/api/requests.ts'
import type { HealthConditionResource } from '@/api/types/health-conditions'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Activity } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const updateHealthConditionSchema = z.object({
  name: zFieldString({ required: true }),
  animal_type_id: z.string().min(1, 'Bitte wähle eine Tierart aus'),
})

type UpdateHealthConditionFormData = z.infer<typeof updateHealthConditionSchema>

interface HealthConditionEditPageProps {
  healthCondition: HealthConditionResource
  animalTypes: AnimalTypeResource[]
  onClose: () => void
}

export function HealthConditionEditPage({
  healthCondition,
  animalTypes,
  onClose,
}: HealthConditionEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateHealthConditionFormData>({
    resolver: zodResolver(updateHealthConditionSchema),
    defaultValues: {
      name: healthCondition.name,
      animal_type_id: healthCondition.animal_type_id,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateHealthConditionFormData) =>
      updateHealthCondition(healthCondition.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: healthConditionQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
  })

  const onSubmit = async (data: UpdateHealthConditionFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Gesundheitszustand bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeite den Gesundheitszustand.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormBlocker />

            <FieldGroup>
              <SelectInput
                name="animal_type_id"
                control={form.control}
                label="Tierart"
                required
                disabled
                options={animalTypes.map((animalType) => ({
                  value: animalType.id,
                  label: animalType.title,
                }))}
                info="Die Tierart kann nicht nachträglich geändert werden"
              />

              <TextInput
                name="name"
                control={form.control}
                label="Name"
                required
              />
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Aktualisiere...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
