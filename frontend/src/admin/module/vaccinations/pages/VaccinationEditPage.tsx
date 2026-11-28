import { type ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { vaccinationQueryKeys } from '@/admin/module/vaccinations/api/queries'
import { updateVaccination } from '@/admin/module/vaccinations/api/requests'
import type { VaccinationResource } from '@/api/types/vaccinations'
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
import { Mark } from '@/components/typo/mark.tsx'

const updateVaccinationSchema = z.object({
  title: zFieldString({ required: true }),
  description: zFieldString(),
})

type UpdateVaccinationFormData = z.infer<typeof updateVaccinationSchema>

interface VaccinationEditPageProps {
  vaccination: VaccinationResource
  onClose: () => void
  breadcrumb?: ReactNode
}

export function VaccinationEditPage({
  vaccination,
  onClose,
  breadcrumb,
}: VaccinationEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateVaccinationFormData>({
    resolver: zodResolver(updateVaccinationSchema),
    defaultValues: {
      title: vaccination.title,
      description: vaccination.description,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateVaccinationFormData) =>
      updateVaccination(vaccination.id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vaccinationQueryKeys.list })
      toast.success(data.message)
      onClose()
    },
  })

  const onSubmit = async (data: UpdateVaccinationFormData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Mark>{vaccination.title}</Mark> bearbeiten
          </DialogTitle>
          <DialogDescription>Bearbeite die Impfung.</DialogDescription>
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
                disabled={updateMutation.isPending}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Aktualisiere...' : 'Speichern'}
              </Button>
            </DialogFooter>
            <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
