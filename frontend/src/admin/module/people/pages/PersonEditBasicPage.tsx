import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personQueryKeys } from '@/admin/module/people/api/queries.ts'
import { updatePerson } from '@/admin/module/people/api/requests.ts'
import type { PersonDetailResource } from '@/api/types/people'
import {
  PersonFormBasic,
  type PersonFormBasicData,
} from '@/admin/module/people/components/PersonFormBasic.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'
import type { UpdatePersonRequest } from '@/admin/module/people/api/types.ts'
import { toApiDate } from '@/components/field/DateInput.utils.ts'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { customFieldQueryKeys } from '@/admin/module/custom-fields/api/queries'
import {
  groupsForSection,
  toCustomFieldsPayload,
} from '@/admin/module/custom-fields/custom-fields.schema'

interface PersonEditBasicPageProps {
  person: PersonDetailResource
  /** Definitions shown for this person (all sections). */
  customFieldGroups: CustomFieldDefinitionGroup[]
}

export function PersonEditBasicPage({
  person,
  customFieldGroups,
}: PersonEditBasicPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePersonRequest) => updatePerson(person.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: personQueryKeys.list })
      queryClient.invalidateQueries({
        queryKey: personQueryKeys.detail(person.id),
      })
      // Emptied out-of-scope groups disappear.
      queryClient.invalidateQueries({
        queryKey: customFieldQueryKeys.definitions('person'),
      })
      toast.success(response.message || 'Person erfolgreich aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Person')
    },
  })

  const handleSubmit = async (data: PersonFormBasicData) => {
    await updateMutation.mutateAsync({
      ...data,
      date_of_birth: toApiDate(data.date_of_birth),
      organization_id: data.organization_id || null,
      custom_fields: toCustomFieldsPayload(data.custom_fields),
    })
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Basis & Kontakt</CardTitle>
      </CardHeader>
      <CardContent>
        <PersonFormBasic
          defaultValues={person}
          customFieldGroups={groupsForSection(customFieldGroups, 'basic')}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
