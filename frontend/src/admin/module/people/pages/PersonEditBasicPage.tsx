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

interface PersonEditBasicPageProps {
  person: PersonDetailResource
}

export function PersonEditBasicPage({ person }: PersonEditBasicPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePersonRequest) => updatePerson(person.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: personQueryKeys.list })
      queryClient.invalidateQueries({
        queryKey: personQueryKeys.detail(person.id),
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
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
