import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { animalQueryKeys } from '@/admin/module/animals/api/queries.ts'
import { updateAnimal } from '@/admin/module/animals/api/requests.ts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { customFieldQueryKeys } from '@/admin/module/custom-fields/api/queries'
import { CustomFieldsForm } from '@/admin/module/custom-fields/components/CustomFieldsForm'
import {
  groupsForSection,
  toCustomFieldsPayload,
} from '@/admin/module/custom-fields/custom-fields.schema'

interface AnimalEditExtraPageProps {
  animal: AnimalDetailResource
  /** Definitions shown for this animal (all sections). */
  customFieldGroups: CustomFieldDefinitionGroup[]
}

export function AnimalEditExtraPage({
  animal,
  customFieldGroups,
}: AnimalEditExtraPageProps) {
  const queryClient = useQueryClient()
  const groups = groupsForSection(customFieldGroups, 'extra')

  const updateMutation = useMutation({
    mutationFn: (customFields: Record<string, unknown>) =>
      updateAnimal(animal.id, {
        custom_fields: toCustomFieldsPayload(customFields),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: animalQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: animalQueryKeys.detail(animal.id),
      })
      // Emptied out-of-scope groups disappear.
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
        <CardTitle>Weitere Angaben</CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Für dieses Tier sind keine weiteren Angaben vorgesehen.
          </p>
        ) : (
          <CustomFieldsForm
            groups={groups}
            values={animal.custom_fields}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync(data.custom_fields)
            }}
            isSubmitting={updateMutation.isPending}
          />
        )}
      </CardContent>
    </Card>
  )
}
