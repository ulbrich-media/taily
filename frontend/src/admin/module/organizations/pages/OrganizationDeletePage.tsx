import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { organizationQueryKeys } from '@/admin/module/organizations/api/queries'
import { deleteOrganization } from '@/admin/module/organizations/api/requests'
import type { OrganizationResource } from '@/api/types/organizations'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { toast } from 'sonner'

interface OrganizationDeletePageProps {
  organization: OrganizationResource
  onDeleted: () => void
}

export function OrganizationDeletePage({
  organization,
  onDeleted,
}: OrganizationDeletePageProps) {
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(organization.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: organizationQueryKeys.list() })
      toast.success(data.message)
      onDeleted()
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Fehler beim Löschen der Organisation'
      )
    },
  })

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const hasPeople = (organization.people_count || 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle variant="destructive">
          <CardTitleIcon icon={AlertTriangle} />
          Organisation löschen
        </CardTitle>
        <CardDescription>
          {hasPeople
            ? 'Diese Organisation kann nicht gelöscht werden, da ihr noch Personen zugewiesen sind. Bitte entferne alle Zuweisungen wenn du diese Organisation löschen möchtest.'
            : 'Bist du sicher, dass du diese Organisation löschen möchtest? Dieser Vorgang kann nicht rückgängig gemacht werden!'}
        </CardDescription>
      </CardHeader>
      {!hasPeople && (
        <CardContent className="space-y-6">
          <>
            <div className="space-y-4">
              <h4 className="font-medium mb-2">
                Folgende Daten werden gelöscht:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Name: {organization.name}</li>
                {organization.email && <li>E-Mail: {organization.email}</li>}
                {organization.city && (
                  <li>
                    Adresse: {organization.city}
                    {organization.postal_code &&
                      `, ${organization.postal_code}`}
                  </li>
                )}
                <li>Alle zugehörigen Kontaktinformationen</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Lösche...' : 'Ja, löschen'}
              </Button>
            </div>
          </>
        </CardContent>
      )}
    </Card>
  )
}
