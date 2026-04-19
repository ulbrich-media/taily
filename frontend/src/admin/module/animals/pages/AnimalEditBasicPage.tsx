import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import { updateAnimal } from '@/admin/module/animals/api/requests.ts'
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
import { toast } from 'sonner'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import type { AnimalDetailResource } from '@/api/types/animals'
import { toApiDate } from '@/components/field/DateInput.utils.ts'

interface AnimalEditBasicPageProps {
  animal: AnimalDetailResource
  animalTypes: AnimalTypeResource[]
}

export function AnimalEditBasicPage({
  animal,
  animalTypes,
}: AnimalEditBasicPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: AnimalFormBasicData) => updateAnimal(animal.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: animalQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: animalQueryKeys.detail(animal.id),
      })
      toast.success(response.message || 'Tier erfolgreich aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren des Tieres')
    },
  })

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Basis & Beschreibung</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimalFormBasic
          animalTypes={animalTypes}
          defaultValues={animal}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({
              ...data,
              date_of_birth: toApiDate(data.date_of_birth),
              intake_date: toApiDate(data.intake_date),
            })
          }}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
