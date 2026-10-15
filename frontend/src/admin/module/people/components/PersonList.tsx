import type { ReactNode } from 'react'
import type { PersonListResource } from '@/api/types/people'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { SortableHead } from '@/components/list/SortableHead'
import {
  PersonAvatar,
  PersonNameAndEmail,
  PersonOrganization,
  PersonOrigin,
  PersonRoleBadges,
} from './PersonListParts'

interface PersonListProps {
  people: PersonListResource[]
  /** Current sort value (e.g. `-created_at`). */
  sort: string
  onSortChange: (sort: string) => void
  renderRowActions: (person: PersonListResource) => ReactNode
}

export function PersonList({
  people,
  sort,
  onSortChange,
  renderRowActions,
}: PersonListProps) {
  const header = (label: string, sortKey: string) => (
    <SortableHead
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSortChange={onSortChange}
    />
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="th-contain"></TableHead>
          {header('Name, E-Mail', 'name')}
          {header('Organisation', 'organization')}
          {header('Herkunft', 'city')}
          {header('Rollen', 'roles')}
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {people.map((person) => (
          <TableRow key={person.id}>
            <TableCell>
              <PersonAvatar person={person} />
            </TableCell>
            <TableCell className="font-medium">
              <PersonNameAndEmail person={person} />
            </TableCell>
            <TableCell>
              <PersonOrganization person={person} />
            </TableCell>
            <TableCell>
              <PersonOrigin person={person} />
            </TableCell>
            <TableCell>
              <PersonRoleBadges person={person} />
            </TableCell>
            <TableCell className="text-right">
              {renderRowActions(person)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
