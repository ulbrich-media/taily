import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { updateAnimalType } from '@/admin/module/animal-types/api/requests'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { FormTemplateResource } from '@/api/types/form-templates'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { PawPrint } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'
import { FormTemplateSelect } from '@/components/field/FormTemplateSelect.tsx'

const updateAnimalTypeSchema = z.object({
  title: zFieldString({ required: true }),
  pre_inspection_form_template_id: z.string().nullable(),
})

type UpdateAnimalTypeFormData = z.infer<typeof updateAnimalTypeSchema>

interface AnimalTypeEditPageProps {
  animalType: AnimalTypeResource
  formTemplates: FormTemplateResource[]
  onClose: () => void
}

export function AnimalTypeEditPage({
  animalType,
  formTemplates,
  onClose,
}: AnimalTypeEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateAnimalTypeFormData>({
    resolver: zodResolver(updateAnimalTypeSchema),
    defaultValues: {
      title: animalType.title,
      pre_inspection_form_template_id:
        animalType.pre_inspection_form_template_id ?? null,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateAnimalTypeFormData) =>
      updateAnimalType(animalType.id, {
        title: data.title,
        pre_inspection_form_template_id:
          data.pre_inspection_form_template_id || null,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: animalTypeQueryKeys.list })
      queryClient.invalidateQueries({
        queryKey: animalTypeQueryKeys.detail(animalType.id),
      })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Aktualisieren der Tierart.'
      )
    },
  })

  const onSubmit = async (data: UpdateAnimalTypeFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            Tierart bearbeiten
          </DialogTitle>
          <DialogDescription>
            Bearbeite die Tierart und ihre Formularvorlage.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormBlocker />

            <FieldGroup>
              <TextInput
                name="title"
                control={form.control}
                label="Name"
                required
              />

              <FormTemplateSelect
                name="pre_inspection_form_template_id"
                control={form.control}
                label="Formular für Vorkontrollen"
                formTemplates={formTemplates}
                canRemove
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
