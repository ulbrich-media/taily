import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ReactNode } from 'react'
import { medicalTestQueryKeys } from '@/admin/module/medical-tests/api/queries'
import { updateMedicalTest } from '@/admin/module/medical-tests/api/requests'
import type { MedicalTestResource } from '@/api/types/medical-tests'
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

const updateMedicalTestSchema = z.object({
  title: zFieldString({ required: true }),
  description: zFieldString(),
})

type UpdateMedicalTestFormData = z.infer<typeof updateMedicalTestSchema>

interface MedicalTestEditPageProps {
  medicalTest: MedicalTestResource
  onClose: () => void
  breadcrumb?: ReactNode
}

export function MedicalTestEditPage({
  medicalTest,
  onClose,
  breadcrumb,
}: MedicalTestEditPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateMedicalTestFormData>({
    resolver: zodResolver(updateMedicalTestSchema),
    defaultValues: {
      title: medicalTest.title,
      description: medicalTest.description,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateMedicalTestFormData) =>
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
          <DialogTitle>
            <Mark>{medicalTest.title}</Mark> bearbeiten
          </DialogTitle>
          <DialogDescription>Bearbeite den Test.</DialogDescription>
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
