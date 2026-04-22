import { useMemo, type ReactNode } from 'react'
import { Syringe, SlashSquareIcon } from 'lucide-react'
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
} from '@/shadcn/components/ui/empty.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import type { VaccinationResource } from '@/api/types/vaccinations'
import { PageHeader } from '@/components/layout/PageHeader'

interface VaccinationListPageProps {
  vaccinations: VaccinationResource[]
  createAction?: ReactNode
  renderRowActions?: (vaccination: VaccinationResource) => ReactNode
}

export function VaccinationListPage({
  vaccinations,
  createAction,
  renderRowActions,
}: VaccinationListPageProps) {
  const groupedVaccinations = useMemo(() => {
    const groups = new Map<
      string,
      { id: string; title: string; vaccinations: VaccinationResource[] }
    >()

    vaccinations?.forEach((vaccination) => {
      const typeId = vaccination.animal_type.id
      if (!groups.has(typeId)) {
        groups.set(typeId, {
          id: typeId,
          title: vaccination.animal_type.title,
          vaccinations: [],
        })
      }
      groups.get(typeId)!.vaccinations.push(vaccination)
    })

    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [vaccinations])

  const hasVaccinations = vaccinations && vaccinations.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Syringe}
        title="Impfungen"
        description="Verwalte die verfügbaren Impfungen der Tiere"
        actions={createAction}
      />

      {hasVaccinations ? (
        <div className="space-y-6">
          {groupedVaccinations.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      {renderRowActions && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.vaccinations.map((vaccination) => (
                      <TableRow key={vaccination.id}>
                        <TableCell className="font-medium">
                          {vaccination.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {vaccination.description || '–'}
                        </TableCell>
                        {renderRowActions && (
                          <TableCell className="text-right">
                            {renderRowActions(vaccination)}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlashSquareIcon />
            </EmptyMedia>
            <EmptyTitle>Keine Impfungen vorhanden</EmptyTitle>
            <EmptyDescription>Erstelle die erste Impfung!</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
