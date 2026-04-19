import type { ReactNode } from 'react'
import { PawPrint, SlashSquareIcon } from 'lucide-react'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shadcn/components/ui/empty'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

interface AnimalTypeListPageProps {
  animalTypes: AnimalTypeResource[]
  createAction?: ReactNode
  renderRowActions?: (animalType: AnimalTypeResource) => ReactNode
}

export function AnimalTypeListPage({
  animalTypes,
  createAction,
  renderRowActions,
}: AnimalTypeListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={PawPrint}
        title="Tierarten"
        description="Verwalte die verfügbaren Tierarten und weise Formularvorlagen zu"
        actions={createAction}
      />

      {animalTypes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Alle Tierarten</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Formularvorlage</TableHead>
                  {renderRowActions && (
                    <TableHead aria-label="Aktionen"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalTypes.map((animalType) => (
                  <TableRow key={animalType.id}>
                    <TableCell className="font-medium">
                      {animalType.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {animalType.form_template?.name ?? '–'}
                    </TableCell>
                    {renderRowActions && (
                      <TableCell className="text-right">
                        {renderRowActions(animalType)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlashSquareIcon />
            </EmptyMedia>
            <EmptyTitle>Keine Tierarten vorhanden</EmptyTitle>
            <EmptyDescription>
              {createAction
                ? 'Erstelle die erste Tierart!'
                : 'Es sind noch keine Tierarten vorhanden.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
