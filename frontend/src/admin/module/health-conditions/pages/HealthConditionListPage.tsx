import { useMemo, type ReactNode } from 'react'
import { Activity, SlashSquareIcon } from 'lucide-react'
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
import type { HealthConditionResource } from '@/api/types/health-conditions'
import { PageHeader } from '@/components/layout/PageHeader'

interface HealthConditionListPageProps {
  healthConditions: HealthConditionResource[]
  createAction?: ReactNode
  renderRowActions?: (condition: HealthConditionResource) => ReactNode
}

export function HealthConditionListPage({
  healthConditions,
  createAction,
  renderRowActions,
}: HealthConditionListPageProps) {
  // Group health conditions by animal type
  const groupedConditions = useMemo(() => {
    const groups = new Map<
      string,
      { title: string; conditions: HealthConditionResource[] }
    >()

    healthConditions?.forEach((condition) => {
      const typeId = condition.animal_type.id
      if (!groups.has(typeId)) {
        groups.set(typeId, {
          title: condition.animal_type.title,
          conditions: [],
        })
      }
      groups.get(typeId)!.conditions.push(condition)
    })

    return Array.from(groups.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    )
  }, [healthConditions])

  const hasConditions = healthConditions && healthConditions.length > 0

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="Gesundheitszustände"
        description="Verwalte die verfügbaren Gesundheitszustände der Tiere"
        actions={createAction}
      />

      {hasConditions ? (
        <div className="space-y-6">
          {groupedConditions.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      {renderRowActions && <TableHead></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.conditions.map((condition) => (
                      <TableRow key={condition.id}>
                        <TableCell className="font-medium">
                          {condition.name}
                        </TableCell>
                        {renderRowActions && (
                          <TableCell className="text-right">
                            {renderRowActions(condition)}
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
            <EmptyTitle>Keine Gesundheitszustände vorhanden</EmptyTitle>
            <EmptyDescription>
              Erstelle den ersten Gesundheitszustand!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}
