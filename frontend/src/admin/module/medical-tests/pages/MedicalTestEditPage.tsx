import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { medicalTestQueryKeys } from '@/admin/module/medical-tests/api/queries'
import { updateMedicalTest } from '@/admin/module/medical-tests/api/requests'
import type { MedicalTestResource } from '@/api/types/medical-tests'
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
import { FlaskConical } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const updateMedicalTestSchema = z.object({
  title: zFieldString({ required: true }),
  description: zFieldString(),
  animal_type_id: z.string().min(1, 'Bitte wähle eine Tierart aus'),
})

type UpdateMedicalTestFormData = z.infer<typeof updateMedicalTestSchema>

interface MedicalTestEditPageProps {
  medicalTest: MedicalTestResource
  animalTypes: AnimalTypeResource[]
  onClose: () => void
}

export function MedicalTestEditPage({
  medicalTest,
  animalTypes,
  onClose,
}: MedicalTestEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateMedicalTestFormData>({
    resolver: zodResolver(updateMedicalTestSchema),
    defaultValues: {
      title: medicalTest.title,
      description: medicalTest.description,
      animal_type_id: medicalTest.animal_type_id,
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ animal_type_id: _, ...data }: UpdateMedicalTestFormData) =>
      updateMedicalTest(medicalTest.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: medicalTestQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
  })

  const onSubmit = async (data: UpdateMedicalTestFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Test bearbeiten
          </DialogTitle>
          <DialogDescription>Bearbeite den Test.</DialogDescription>
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
                name="title"
                control={form.control}
                label="Titel"
                required
              />

              <TextInput
                name="description"
                control={form.control}
                label="Beschreibung"
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
