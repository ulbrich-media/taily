import type { ReactNode } from 'react'
import type { TransportListResource } from '@/api/types/transports'
import { Button } from '@/shadcn/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { Badge } from '@/shadcn/components/ui/badge'
import { formatApiDate } from '@/lib/dates.utils'

interface TransportListProps {
  transports: TransportListResource[]
  renderDetailAction: (t: TransportListResource) => ReactNode
}

export function TransportList({
  transports,
  renderDetailAction,
}: TransportListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Datum</TableHead>
          <TableHead>Tiere</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transports.map((transport) => (
          <TableRow key={transport.id}>
            <TableCell>
              {transport.planned_at ? formatApiDate(transport.planned_at) : '–'}
            </TableCell>
            <TableCell>
              {transport.animal_count}{' '}
              {transport.animal_count === 1 ? 'Tier' : 'Tiere'}
            </TableCell>
            <TableCell>
              {transport.is_done ? (
                <Badge variant="success">Abgeschlossen</Badge>
              ) : (
                <Badge variant="outline">Offen</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" asChild>
                {renderDetailAction(transport)}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
