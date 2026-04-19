import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { healthConditionQueryKeys } from '@/admin/module/health-conditions/api/queries.ts'
import { createHealthCondition } from '@/admin/module/health-conditions/api/requests.ts'
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

const createHealthConditionSchema = z.object({
  name: zFieldString({ required: true }),
  animal_type_id: z.string().min(1, 'Bitte wähle eine Tierart aus'),
})

type CreateHealthConditionFormData = z.infer<typeof createHealthConditionSchema>

interface HealthConditionCreatePageProps {
  animalTypes: AnimalTypeResource[]
  onClose: () => void
}

export function HealthConditionCreatePage({
  animalTypes,
  onClose,
}: HealthConditionCreatePageProps) {
  const queryClient = useQueryClient()

  const [keepOpen, setKeepOpen] = useState(false)

  const form = useForm<CreateHealthConditionFormData>({
    resolver: zodResolver(createHealthConditionSchema),
    defaultValues: {
      name: '',
      animal_type_id: animalTypes.length === 1 ? animalTypes[0].id : '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createHealthCondition,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: healthConditionQueryKeys.list })
      toast.success(data.message)

      if (keepOpen) {
        form.reset({
          name: '',
          animal_type_id: form.getValues('animal_type_id'),
        })
        setKeepOpen(false)
      } else {
        onClose()
      }
    },
  })

  const onSubmit = async (data: CreateHealthConditionFormData) => {
    await createMutation.mutateAsync(data)
  }

  const handleSaveAndNew = () => {
    setKeepOpen(true)
    form.handleSubmit(onSubmit)()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Neuen Gesundheitszustand erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Gesundheitszustand für eine Tierart.
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
                options={animalTypes.map((animalType) => ({
                  value: animalType.id,
                  label: animalType.title,
                }))}
                placeholder="Tierart auswählen"
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
                disabled={createMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveAndNew}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && keepOpen
                  ? 'Erstelle...'
                  : 'Speichern und Neu'}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && !keepOpen
                  ? 'Erstelle...'
                  : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
