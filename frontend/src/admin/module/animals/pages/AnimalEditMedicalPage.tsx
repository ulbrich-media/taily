import type { ReactNode } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import { updateAnimal } from '@/admin/module/animals/api/requests.ts'
import {
  AnimalFormHealth,
  type AnimalFormHealthData,
} from '@/admin/module/animals/components/AnimalFormHealth.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'
import type { HealthConditionResource } from '@/api/types/health-conditions'
import type { AnimalDetailResource } from '@/api/types/animals'
import { toApiDate } from '@/components/field/DateInput.utils.ts'

interface AnimalEditMedicalPageProps {
  animal: AnimalDetailResource
  healthConditions: HealthConditionResource[]
  healthConditionsLink?: ReactNode
}

export function AnimalEditMedicalPage({
  animal,
  healthConditions,
  healthConditionsLink,
}: AnimalEditMedicalPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: AnimalFormHealthData) =>
      updateAnimal(animal.id, {
        is_neutered: data.is_neutered,
        health_description: data.health_description,
        tasso_id: data.tasso_id,
        findefix_id: data.findefix_id,
        trace_id: data.trace_id,
        vaccinations: data.vaccinations
          .filter((v) => v.result === 'done')
          .map((v) => ({
            vaccinated_at: toApiDate(v.vaccinated_at) ?? '',
            health_condition_id: v.health_condition_id,
          })),
        tests: data.tests
          .filter((t) => ['positive', 'negative'].includes(t.result))
          .map((t) => ({
            result: t.result === 'positive' ? 'positive' : 'negative',
            tested_at: toApiDate(t.tested_at) ?? '',
            health_condition_id: t.health_condition_id,
          })),
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: animalQueryKeys.list() })
      await queryClient.invalidateQueries({
        queryKey: animalQueryKeys.detail(animal.id),
      })
      toast.success(
        response.message || 'Gesundheitsdaten erfolgreich aktualisiert'
      )
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Gesundheitsdaten')
    },
  })

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Gesundheit & Identifikation</CardTitle>
      </CardHeader>
      <CardContent>
        <AnimalFormHealth
          healthConditions={healthConditions}
          defaultValues={animal}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync(data)
          }}
          isSubmitting={updateMutation.isPending}
          healthConditionsLink={healthConditionsLink}
        />
      </CardContent>
    </Card>
  )
}
