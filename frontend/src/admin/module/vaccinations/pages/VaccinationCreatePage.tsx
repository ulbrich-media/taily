import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { vaccinationQueryKeys } from '@/admin/module/vaccinations/api/queries'
import { createVaccination } from '@/admin/module/vaccinations/api/requests'
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
import { Syringe } from 'lucide-react'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { SelectInput } from '@/components/field/SelectInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const createVaccinationSchema = z.object({
  title: zFieldString({ required: true }),
  description: zFieldString(),
  animal_type_id: z.string().min(1, 'Bitte wähle eine Tierart aus'),
})

type CreateVaccinationFormData = z.infer<typeof createVaccinationSchema>

interface VaccinationCreatePageProps {
  animalTypes: AnimalTypeResource[]
  onClose: () => void
}

export function VaccinationCreatePage({
  animalTypes,
  onClose,
}: VaccinationCreatePageProps) {
  const queryClient = useQueryClient()
  const [keepOpen, setKeepOpen] = useState(false)

  const form = useForm<CreateVaccinationFormData>({
    resolver: zodResolver(createVaccinationSchema),
    defaultValues: {
      title: '',
      description: '',
      animal_type_id: animalTypes.length === 1 ? animalTypes[0].id : '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createVaccination,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: vaccinationQueryKeys.list })
      toast.success(data.message)

      if (keepOpen) {
        form.reset({
          title: '',
          description: '',
          animal_type_id: form.getValues('animal_type_id'),
        })
        setKeepOpen(false)
      } else {
        onClose()
      }
    },
  })

  const onSubmit = async (data: CreateVaccinationFormData) => {
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
            <Syringe className="h-5 w-5 text-primary" />
            Neue Impfung erstellen
          </DialogTitle>
          <DialogDescription>
            Erstelle eine neue Impfung für eine Tierart.
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
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
