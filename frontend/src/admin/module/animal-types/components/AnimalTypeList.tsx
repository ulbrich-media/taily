import type { ReactNode } from 'react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Table,
  TableBody,
  TableCell,
  TableCellEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { ListCard, ListCardGrid } from '@/components/list/ListCardGrid'
import { InfoRow } from '@/shadcn/components/common/info-row'

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
          <TableHead>Formular Vorkontrolle</TableHead>
          {renderRowActions && <TableHead aria-label="Aktionen"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {animalTypes.map((animalType) => (
          <TableRow key={animalType.id}>
            <TableCell className="font-medium">{animalType.title}</TableCell>
            {animalType.pre_inspection_form_template?.name ? (
              <TableCell>
                {animalType.pre_inspection_form_template.name}
              </TableCell>
            ) : (
              <TableCellEmpty />
            )}
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
        >
          <InfoRow label="Formular Vorkontrolle">
            {animalType.pre_inspection_form_template?.name}
          </InfoRow>
        </ListCard>
      )}
    </ListCardGrid>
  )
}
