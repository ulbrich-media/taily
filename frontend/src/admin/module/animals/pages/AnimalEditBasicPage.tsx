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
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { customFieldQueryKeys } from '@/admin/module/custom-fields/api/queries'
import {
  groupsForSection,
  toCustomFieldsPayload,
} from '@/admin/module/custom-fields/custom-fields.schema'

interface AnimalEditBasicPageProps {
  animal: AnimalDetailResource
  animalTypes: AnimalTypeResource[]
  /** Definitions shown for this animal (all sections). */
  customFieldGroups: CustomFieldDefinitionGroup[]
}

export function AnimalEditBasicPage({
  animal,
  animalTypes,
  customFieldGroups,
}: AnimalEditBasicPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: AnimalFormBasicData) => updateAnimal(animal.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: animalQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: animalQueryKeys.detail(animal.id),
      })
      // The animal type may have changed, and with it the groups in scope.
      queryClient.invalidateQueries({
        queryKey: customFieldQueryKeys.definitions('animal'),
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
          customFieldGroups={groupsForSection(customFieldGroups, 'basic')}
          onSubmit={async (data) => {
            await updateMutation.mutateAsync({
              ...data,
              date_of_birth: toApiDate(data.date_of_birth),
              intake_date: toApiDate(data.intake_date),
              custom_fields: toCustomFieldsPayload(data.custom_fields),
            })
          }}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
