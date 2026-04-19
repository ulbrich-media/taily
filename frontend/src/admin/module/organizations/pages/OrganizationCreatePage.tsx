import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationQueryKeys } from '@/admin/module/organizations/api/queries'
import { createOrganization } from '@/admin/module/organizations/api/requests'
import {
  OrganizationFormBasic,
  type OrganizationFormBasicData,
} from '@/admin/module/organizations/components/OrganizationFormBasic'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { toast } from 'sonner'
import { Building2 } from 'lucide-react'
import { useFormSaveAndResetHook } from '@/lib/form.hook.tsx'

interface OrganizationCreatePageProps {
  onCreated: (id: string) => void
  onCancel: () => void
}

export function OrganizationCreatePage({
  onCreated,
  onCancel,
}: OrganizationCreatePageProps) {
  const queryClient = useQueryClient()

  const saveAndReset = useFormSaveAndResetHook()

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.list() })
      toast.success(response.message || 'Organisation erfolgreich erstellt')

      if (!saveAndReset.shouldReset) {
        onCreated(response.data.id)
      }
    },
    onError: () => {
      toast.error('Fehler beim Erstellen der Organisation')
    },
    onSettled: () => {
      saveAndReset.onFormSubmit()
    },
  })

  const handleSubmit = async (data: OrganizationFormBasicData) => {
    await createMutation.mutateAsync(data)
  }

  const handleSecondarySubmit = () => {
    saveAndReset.enableShouldReset()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          Organisation erstellen
        </h1>
        <p className="text-muted-foreground mt-2">
          Erfasse eine neue Organisation im System
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basis & Kontakt</CardTitle>
          <CardDescription>
            Grundlegende Informationen zur neuen Organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationFormBasic
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
