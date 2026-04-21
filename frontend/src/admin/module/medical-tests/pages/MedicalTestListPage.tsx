import { useMemo, type ReactNode } from 'react'
import { FlaskConical, SlashSquareIcon } from 'lucide-react'
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
import type { MedicalTestResource } from '@/api/types/medical-tests'
import { PageHeader } from '@/components/layout/PageHeader'

interface MedicalTestListPageProps {
  medicalTests: MedicalTestResource[]
  createAction?: ReactNode
  renderRowActions?: (medicalTest: MedicalTestResource) => ReactNode
}

export function MedicalTestListPage({
  medicalTests,
  createAction,
  renderRowActions,
}: MedicalTestListPageProps) {
  const groupedTests = useMemo(() => {
    const groups = new Map<
      string,
      { title: string; tests: MedicalTestResource[] }
    >()

    medicalTests?.forEach((test) => {
      const typeId = test.animal_type.id
      if (!groups.has(typeId)) {
        groups.set(typeId, {
          title: test.animal_type.title,
          tests: [],
        })
      }
      groups.get(typeId)!.tests.push(test)
    })

    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [medicalTests])

  const hasTests = medicalTests && medicalTests.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Tests"
        description="Verwalte die verfügbaren medizinischen Tests der Tiere"
        actions={createAction}
      />

      {hasTests ? (
        <div className="space-y-6">
          {groupedTests.map((group) => (
            <Card key={group.title}>
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
                    {group.tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">
                          {test.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {test.description || '–'}
                        </TableCell>
                        {renderRowActions && (
                          <TableCell className="text-right">
                            {renderRowActions(test)}
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
            <EmptyTitle>Keine Tests vorhanden</EmptyTitle>
            <EmptyDescription>Erstelle den ersten Test!</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
