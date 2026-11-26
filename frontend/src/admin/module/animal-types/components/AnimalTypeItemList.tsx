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
import { InfoRow } from '@/shadcn/components/common/info-row'

/** What vaccinations and medical tests have in common. */
export interface AnimalTypeItem {
  id: string
  title: string
  description: string
  animal_type: AnimalTypeResource
}

interface AnimalTypeItemViewProps<T extends AnimalTypeItem> {
  items: T[]
  renderRowActions?: (item: T) => ReactNode
  /** False inside one animal type's page, where the column would repeat. */
  showAnimalType?: boolean
}

export function AnimalTypeItemList<T extends AnimalTypeItem>({
  items,
  renderRowActions,
  showAnimalType = true,
}: AnimalTypeItemViewProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAnimalType && <TableHead>Tierart</TableHead>}
          <TableHead>Titel</TableHead>
          <TableHead>Beschreibung</TableHead>
          {renderRowActions && <TableHead className="th-contain"></TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            {showAnimalType && <TableCell>{item.animal_type.title}</TableCell>}
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell className="text-muted-foreground">
              {item.description || '–'}
            </TableCell>
            {renderRowActions && (
              <TableCell className="text-right">
                {renderRowActions(item)}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function AnimalTypeItemCardGrid<T extends AnimalTypeItem>({
  items,
  renderRowActions,
  showAnimalType = true,
  className,
}: AnimalTypeItemViewProps<T> & { className?: string }) {
  return (
    <ListCardGrid
      items={items}
      getKey={(item) => item.id}
      className={className}
    >
      {(item) => (
        <ListCard
          header={<p className="font-medium">{item.title}</p>}
          footer={renderRowActions?.(item)}
        >
          {showAnimalType && (
            <InfoRow label="Tierart">{item.animal_type.title}</InfoRow>
          )}
          <InfoRow label="Beschreibung">{item.description || '–'}</InfoRow>
        </ListCard>
      )}
    </ListCardGrid>
  )
}
