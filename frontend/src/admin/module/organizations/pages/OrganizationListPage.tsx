import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import type { OrganizationResource } from '@/api/types/organizations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { TableListView } from '@/components/list/TableListView'
import { PageHeader } from '@/components/layout/PageHeader'

interface OrganizationListPageProps {
  organizations: OrganizationResource[]
  createAction: ReactNode
  renderRowActions: (organization: OrganizationResource) => ReactNode
}

export function OrganizationListPage({
  organizations,
  createAction,
  renderRowActions,
}: OrganizationListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Organisationen"
        description="Verwalte alle Organisationen im System"
        actions={createAction}
      />

      <TableListView
        data={organizations}
        emptyState={{
          title: 'Keine Organisationen gefunden',
          description: 'Füge jetzt eine Organisation hinzu!',
        }}
      >
        {(organizations) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Stadt</TableHead>
                <TableHead>Personen</TableHead>
                <TableHead className="th-contain"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell className="font-medium">
                    {organization.name}
                  </TableCell>
                  <TableCell>{organization.email || '-'}</TableCell>
                  <TableCell>{organization.city || '-'}</TableCell>
                  <TableCell>{organization.people_count || 0}</TableCell>
                  <TableCell className="text-right">
                    {renderRowActions(organization)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableListView>
    </div>
  )
}
