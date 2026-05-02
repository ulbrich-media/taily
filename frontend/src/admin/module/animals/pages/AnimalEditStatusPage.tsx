import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import { updateAnimal } from '@/admin/module/animals/api/requests.ts'
import {
  AnimalFormStatus,
  type AnimalFormStatusData,
} from '@/admin/module/animals/components/AnimalFormStatus.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'
import type { AnimalDetailResource } from '@/api/types/animals'
import type { UpdateAnimalRequest } from '@/admin/module/animals/api/types.ts'
import { toApiDate } from '@/components/field/DateInput.utils.ts'

interface AnimalEditStatusPageProps {
  animal: AnimalDetailResource
}

export function AnimalEditStatusPage({ animal }: AnimalEditStatusPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UpdateAnimalRequest>) =>
      updateAnimal(animal.id, data),
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

  const handleSubmit = async (data: AnimalFormStatusData) => {
    await updateMutation.mutateAsync({
      ...data,
      date_of_death: toApiDate(data.date_of_death),
    })
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Organisation, Marketing & Status</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimalFormStatus
          defaultValues={animal}
          animalTypeId={animal.animal_type_id}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
