import { type ReactNode } from 'react'
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
  DialogBreadcrumb,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'
import { FormTemplateSelect } from '@/components/field/FormTemplateSelect.tsx'

const createAnimalTypeSchema = z.object({
  title: zFieldString({ required: true }),
  pre_inspection_form_template_id: z.string().nullable(),
})

type CreateAnimalTypeFormData = z.infer<typeof createAnimalTypeSchema>

interface AnimalTypeCreatePageProps {
  formTemplates: FormTemplateResource[]
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AnimalTypeCreatePage({
  formTemplates,
  onClose,
  breadcrumb,
}: AnimalTypeCreatePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<CreateAnimalTypeFormData>({
    resolver: zodResolver(createAnimalTypeSchema),
    defaultValues: {
      title: '',
      pre_inspection_form_template_id: null,
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
      pre_inspection_form_template_id: data.pre_inspection_form_template_id,
    })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Tierart erstellen</DialogTitle>
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
                disabled={createMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Erstelle...' : 'Speichern'}
              </Button>
            </DialogFooter>
            <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
