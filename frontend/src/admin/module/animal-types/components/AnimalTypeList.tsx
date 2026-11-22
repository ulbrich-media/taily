import type { ReactNode } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { ListCard, ListCardGrid } from '@/components/list/ListCardGrid'

interface AnimalTypeViewProps {
  animalTypes: AnimalTypeResource[]
  renderRowActions?: (animalType: AnimalTypeResource) => ReactNode
}

export function AnimalTypeList({
  animalTypes,
  renderRowActions,
}: AnimalTypeViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          {renderRowActions && <TableHead aria-label="Aktionen"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {animalTypes.map((animalType) => (
          <TableRow key={animalType.id}>
            <TableCell className="font-medium">{animalType.title}</TableCell>
            {renderRowActions && (
              <TableCell className="text-right">
                {renderRowActions(animalType)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function AnimalTypeCardGrid({
  animalTypes,
  renderRowActions,
  className,
}: AnimalTypeViewProps & { className?: string }) {
  return (
    <ListCardGrid
      items={animalTypes}
      getKey={(animalType) => animalType.id}
      className={className}
    >
      {(animalType) => (
        <ListCard
          header={<p className="font-medium">{animalType.title}</p>}
          footer={renderRowActions?.(animalType)}
        />
      )}
    </ListCardGrid>
  )
}
