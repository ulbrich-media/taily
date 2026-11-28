import { useState, type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { vaccinationQueryKeys } from '@/admin/module/vaccinations/api/queries'
import { createVaccination } from '@/admin/module/vaccinations/api/requests'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBreadcrumb,
} from '@/shadcn/components/ui/dialog.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const createVaccinationSchema = z.object({
  title: zFieldString({ required: true }),
  description: zFieldString(),
})

type CreateVaccinationFormData = z.infer<typeof createVaccinationSchema>

interface VaccinationCreatePageProps {
  /** The vaccination always belongs to this animal type. */
  animalTypeId: string
  onClose: () => void
  breadcrumb?: ReactNode
}

export function VaccinationCreatePage({
  animalTypeId,
  onClose,
  breadcrumb,
}: VaccinationCreatePageProps) {
  const queryClient = useQueryClient()
  const [keepOpen, setKeepOpen] = useState(false)

  const form = useForm<CreateVaccinationFormData>({
    resolver: zodResolver(createVaccinationSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createVaccination,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vaccinationQueryKeys.list })
      toast.success(data.message)

      if (keepOpen) {
        form.reset({ title: '', description: '' })
        setKeepOpen(false)
      } else {
        onClose()
      }
    },
    onError: (err) => {
      toast.error(err?.message || 'Fehler beim Erstellen der Impfung')
      setKeepOpen(false)
    },
  })

  const onSubmit = async (data: CreateVaccinationFormData) => {
    await createMutation.mutateAsync({ ...data, animal_type_id: animalTypeId })
  }

  const handleSaveAndNew = () => {
    setKeepOpen(true)
    form
      .handleSubmit(onSubmit)()
      .catch(() => setKeepOpen(false))
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Impfung erstellen</DialogTitle>
          <DialogDescription>
            Erstelle eine neue Impfung für diese Tierart.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormBlocker />

            <FieldGroup>
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
            <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
