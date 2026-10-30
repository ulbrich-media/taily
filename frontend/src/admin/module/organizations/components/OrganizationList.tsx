import type { ReactNode } from 'react'
import type { OrganizationResource } from '@/api/types/organizations'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'

interface OrganizationListProps {
  organizations: OrganizationResource[]
  renderRowActions: (organization: OrganizationResource) => ReactNode
}

export function OrganizationList({
  organizations,
  renderRowActions,
}: OrganizationListProps) {
  return (
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
            <TableCell className="font-medium">{organization.name}</TableCell>
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
  )
}
