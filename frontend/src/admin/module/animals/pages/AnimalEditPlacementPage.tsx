import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import { updateAnimal } from '@/admin/module/animals/api/requests.ts'
import {
  AnimalFormPlacement,
  type AnimalFormPlacementData,
} from '@/admin/module/animals/components/AnimalFormPlacement.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'
import type { PersonListResource } from '@/api/types/people'
import type { AnimalDetailResource } from '@/api/types/animals'

interface AnimalEditPlacementPageProps {
  persons: PersonListResource[]
  mediators: PersonListResource[]
  animal: AnimalDetailResource
}

export function AnimalEditPlacementPage({
  persons,
  mediators,
  animal,
}: AnimalEditPlacementPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: AnimalFormPlacementData) =>
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

  const handleSubmit = async (data: AnimalFormPlacementData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Vermittlung, Vertrag & Kosten</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimalFormPlacement
          persons={persons}
          mediators={mediators}
          defaultValues={animal}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
