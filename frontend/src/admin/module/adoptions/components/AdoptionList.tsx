import type { ReactNode } from 'react'
import type { AdoptionListResource } from '@/api/types/adoptions'
import { AdoptionStatusIndicator } from './AdoptionStatusIndicator'
import {
  AnimalSummary,
  ApplicantSummary,
  MediatorSummary,
} from './AdoptionParties'
import { Button } from '@/shadcn/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { SortableHead } from '@/components/list/SortableHead'

interface AdoptionListProps {
  adoptions: AdoptionListResource[]
  showAnimal?: boolean
  showApplicant?: boolean
  showMediator?: boolean
  /** Current sort value (e.g. `-created_at`); makes the column headers sortable. */
  sort?: string
  onSortChange?: (sort: string) => void
  renderDetailLink?: (adoption: AdoptionListResource) => ReactNode
}

export function AdoptionList({
  adoptions,
  showAnimal = true,
  showApplicant = true,
  showMediator = true,
  sort,
  onSortChange,
  renderDetailLink,
}: AdoptionListProps) {
  const sortable = sort !== undefined && onSortChange !== undefined

  const header = (label: string, sortKey: string) =>
    sortable ? (
      <SortableHead
        label={label}
        sortKey={sortKey}
        sort={sort}
        onSortChange={onSortChange}
      />
    ) : (
      <TableHead>{label}</TableHead>
    )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {showAnimal && header('Tier', 'animal_name')}
          {showApplicant && header('Interessent', 'applicant_name')}
          {showMediator && header('Vermittler', 'mediator_name')}
          <TableHead>Status</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {adoptions.map((adoption) => (
          <TableRow key={adoption.id}>
            {showAnimal && (
              <TableCell>
                <AnimalSummary animal={adoption.animal} />
              </TableCell>
            )}
            {showApplicant && (
              <TableCell>
                <ApplicantSummary applicant={adoption.applicant} />
              </TableCell>
            )}
            {showMediator && (
              <TableCell>
                <MediatorSummary mediator={adoption.mediator} />
              </TableCell>
            )}
            <TableCell>
              <AdoptionStatusIndicator adoption={adoption} />
            </TableCell>
            <TableCell className="text-right">
              {renderDetailLink && (
                <Button size="sm" variant="outline" asChild>
                  {renderDetailLink(adoption)}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
