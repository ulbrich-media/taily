import { useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationQueryKeys } from '@/admin/module/organizations/api/queries'
import { updateOrganization } from '@/admin/module/organizations/api/requests'
import type { OrganizationResource } from '@/api/types/organizations'
import {
  OrganizationFormBasic,
  type OrganizationFormBasicData,
} from '@/admin/module/organizations/components/OrganizationFormBasic'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { toast } from 'sonner'

interface OrganizationEditBasicPageProps {
  organization: OrganizationResource
}

export function OrganizationEditBasicPage({
  organization,
}: OrganizationEditBasicPageProps) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationFormBasicData) =>
      updateOrganization(organization.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(organization.id),
      })
      toast.success(response.message || 'Organisation erfolgreich aktualisiert')
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Organisation')
    },
  })

  const handleSubmit = async (data: OrganizationFormBasicData) => {
    await updateMutation.mutateAsync(data)
  }

  return (
    <Card>
      <CardHeader className="sr-only">
        <CardTitle>Basis & Kontakt</CardTitle>
      </CardHeader>
      <CardContent>
        <OrganizationFormBasic
          defaultValues={organization}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
        />
      </CardContent>
    </Card>
  )
}
