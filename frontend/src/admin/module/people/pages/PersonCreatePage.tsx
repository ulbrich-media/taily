import { useMutation, useQueryClient } from '@tanstack/react-query'
import { personQueryKeys } from '@/admin/module/people/api/queries'
import { createPerson } from '@/admin/module/people/api/requests'
import {
  PersonFormBasic,
  type PersonFormBasicData,
} from '@/admin/module/people/components/PersonFormBasic.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { useFormSaveAndResetHook } from '@/lib/form.hook.tsx'

interface PersonCreatePageProps {
  onCreated: (id: string) => void
  onCancel: () => void
}

export function PersonCreatePage({
  onCreated,
  onCancel,
}: PersonCreatePageProps) {
  const queryClient = useQueryClient()

  const saveAndReset = useFormSaveAndResetHook()

  const createMutation = useMutation({
    mutationFn: createPerson,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: personQueryKeys.list })
      toast.success(response.message || 'Person erfolgreich erstellt')

      if (!saveAndReset.shouldReset) {
        onCreated(response.data.id)
      }
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Person')
    },
    onSettled: () => {
      saveAndReset.onFormSubmit()
    },
  })

  const handleSubmit = async (data: PersonFormBasicData) => {
    await createMutation.mutateAsync({
      ...data,
      organization_id: data.organization_id || null,
    })
  }

  const handleSecondarySubmit = () => {
    saveAndReset.enableShouldReset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-primary" />
          Person erstellen
        </h1>
        <p className="text-muted-foreground mt-2">
          Erfasse eine neue Person im System
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basis & Kontakt</CardTitle>
          <CardDescription>
            Grundlegende Informationen zur neuen Person. Weitere Details können
            nach dem Erstellen ergänzt werden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonFormBasic
            key={saveAndReset.formKey}
            onSubmit={handleSubmit}
            onCancel={onCancel}
            isSubmitting={createMutation.isPending}
            showSecondaryButton={true}
            onSecondarySubmit={handleSecondarySubmit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
