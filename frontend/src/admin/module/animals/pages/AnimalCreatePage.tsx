import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PawPrint, ArrowLeft } from 'lucide-react'
import { createAnimal } from '@/admin/module/animals/api/requests.ts'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import {
  AnimalFormBasic,
  type AnimalFormBasicData,
} from '@/admin/module/animals/components/AnimalFormBasic.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { toast } from 'sonner'
import { useFormSaveAndResetHook } from '@/lib/form.hook.tsx'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import { toApiDate } from '@/components/field/DateInput.utils.ts'

interface AnimalCreatePageProps {
  defaultAnimalTypeId?: string
  animalTypes: AnimalTypeResource[]
  onCreated: (animalTypeId: string, animalId: string) => void
  onCancel: () => void
}

export function AnimalCreatePage({
  defaultAnimalTypeId,
  animalTypes,
  onCreated,
  onCancel,
}: AnimalCreatePageProps) {
  const queryClient = useQueryClient()
  const saveAndReset = useFormSaveAndResetHook()

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: animalQueryKeys.list() })
      toast.success(response.message || 'Tier erfolgreich erstellt')

      if (saveAndReset.shouldReset) {
        saveAndReset.onFormSubmit()
      } else {
        onCreated(response.data.animal_type_id, response.data.id)
      }
    },
    onError: () => {
      toast.error('Fehler beim Erstellen des Tieres')
      saveAndReset.disableShouldReset()
    },
  })

  const handleSubmit = async (data: AnimalFormBasicData) => {
    await createMutation.mutateAsync({
      animal_type_id: data.animal_type_id,
      name: data.name,
      gender: data.gender,
      animal_number: data.animal_number || '',
      old_name: data.old_name || undefined,
      breed: data.breed || undefined,
      color: data.color || undefined,
      weight_grams: data.weight_grams || undefined,
      size_cm: data.size_cm || undefined,
      date_of_birth: toApiDate(data.date_of_birth),
      origin_country: data.origin_country || undefined,
      intake_date: toApiDate(data.intake_date),
      character_description: data.character_description || undefined,
      contract_notes: data.contract_notes || undefined,
      internal_notes: data.internal_notes || undefined,
    })
  }

  const handleSubmitAndNew = () => {
    saveAndReset.enableShouldReset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onCancel}>
          <ArrowLeft />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <PawPrint className="h-8 w-8 text-primary" />
            Neues Tier hinzufügen
          </h1>
          <p className="text-muted-foreground mt-2">
            Erfasse die grundlegenden Informationen für ein neues Tier
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basis & Beschreibung</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimalFormBasic
            key={saveAndReset.formKey}
            animalTypes={animalTypes}
            defaultValues={
              defaultAnimalTypeId
                ? { animal_type_id: defaultAnimalTypeId }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={createMutation.isPending}
            submitLabel="Erstellen"
            showSecondaryButton={true}
            onSecondarySubmit={handleSubmitAndNew}
            secondaryButtonLabel="Erstellen und Neu"
          />
        </CardContent>
      </Card>
    </div>
  )
}
