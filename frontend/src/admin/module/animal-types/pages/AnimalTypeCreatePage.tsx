import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { animalTypeQueryKeys } from '@/admin/module/animal-types/api/queries'
import { createAnimalType } from '@/admin/module/animal-types/api/requests'
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
import { SelectInput } from '@/components/field/SelectInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const createAnimalTypeSchema = z.object({
  title: zFieldString({ required: true }),
  form_template_id: z.string().nullable(),
})

type CreateAnimalTypeFormData = z.infer<typeof createAnimalTypeSchema>

interface AnimalTypeCreatePageProps {
  formTemplates: FormTemplateResource[]
  onClose: () => void
}

export function AnimalTypeCreatePage({
  formTemplates,
  onClose,
}: AnimalTypeCreatePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateAnimalTypeFormData>({
    resolver: zodResolver(createAnimalTypeSchema),
    defaultValues: {
      title: '',
      form_template_id: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: createAnimalType,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: animalTypeQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Erstellen der Tierart.'
      )
    },
  })

  const onSubmit = async (data: CreateAnimalTypeFormData) => {
    await createMutation.mutateAsync({
      title: data.title,
      form_template_id: data.form_template_id,
    })
  }

  const formTemplateOptions = formTemplates.map((ft) => ({
    value: ft.id,
    label: ft.name,
  }))

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-primary" />
            Neue Tierart erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle eine neue Tierart und weise optional eine Formularvorlage
            zu.
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

              <SelectInput
                name="form_template_id"
                control={form.control}
                label="Formularvorlage"
                options={formTemplateOptions}
                placeholder="Keine Vorlage"
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
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Erstelle...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
