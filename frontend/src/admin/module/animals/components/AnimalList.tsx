import type { ReactNode } from 'react'
import type { AnimalListResource } from '@/api/types/animals'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { SortableHead } from '@/components/list/SortableHead'
import { AnimalAvatar, AnimalPublishBadges } from './AnimalStatusBadges'

interface AnimalListProps {
  animals: AnimalListResource[]
  /** Current sort value (e.g. `-created_at`). */
  sort: string
  onSortChange: (sort: string) => void
  renderRowActions: (animal: AnimalListResource) => ReactNode
}

export function AnimalList({
  animals,
  sort,
  onSortChange,
  renderRowActions,
}: AnimalListProps) {
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
          <TableHead className="w-12"></TableHead>
          {header('Name', 'name')}
          <TableHead>Tierart</TableHead>
          {header('Rasse', 'breed')}
          {header('Farbe', 'color')}
          <TableHead className="w-20">Status</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {animals.map((animal) => (
          <TableRow key={animal.id}>
            <TableCell>
              <AnimalAvatar animal={animal} />
            </TableCell>
            <TableCell className="font-medium">
              {animal.name}
              {animal.old_name && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  (früher {animal.old_name})
                </span>
              )}
            </TableCell>
            <TableCell>{animal.animal_type?.title || '-'}</TableCell>
            <TableCell>{animal.breed || '-'}</TableCell>
            <TableCell>{animal.color || '-'}</TableCell>
            <TableCell>
              <AnimalPublishBadges animal={animal} />
            </TableCell>
            <TableCell className="text-right">
              {renderRowActions(animal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
