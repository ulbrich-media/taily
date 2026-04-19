import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personQueryKeys } from '@/admin/module/people/api/queries.ts'
import { updatePerson } from '@/admin/module/people/api/requests.ts'
import type { PersonDetailResource } from '@/api/types/people'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  PersonFormRoles,
  type PersonFormRolesData,
} from '@/admin/module/people/components/PersonFormRoles.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'

interface PersonEditRolesPageProps {
  person: PersonDetailResource
  animalTypes: AnimalTypeResource[]
}

export function PersonEditRolesPage({
  person,
  animalTypes,
}: PersonEditRolesPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: PersonFormRolesData) => updatePerson(person.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: personQueryKeys.list })
      queryClient.invalidateQueries({
        queryKey: personQueryKeys.detail(person.id),
      })
      toast.success(response.message || 'Rollen erfolgreich aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Rollen')
    },
  })

  const handleSubmit = async (data: PersonFormRolesData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Rollen</CardTitle>
      </CardHeader>
      <CardContent>
        <PersonFormRoles
          defaultValues={person}
          animalTypes={animalTypes}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
