import type { ReactNode } from 'react'
import { ListPlus } from 'lucide-react'
import type {
  CustomFieldEntity,
  CustomFieldGroupResource,
} from '@/api/types/custom-fields'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
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
  CUSTOM_FIELD_ENTITY_LABELS,
  CUSTOM_FIELD_SECTIONS,
} from '../custom-field.labels'
import { describeGroupScope } from '../custom-field-group.utils'

interface CustomFieldGroupListPageProps {
  groups: CustomFieldGroupResource[]
  createAction?: ReactNode
  renderRowActions?: (group: CustomFieldGroupResource) => ReactNode
  breadcrumb?: ReactNode
}

const ENTITIES: CustomFieldEntity[] = ['animal', 'person']

/**
 * Plain list (small and bounded, see list-views.md), grouped by entity and
 * section.
 */
export function CustomFieldGroupListPage({
  groups,
  createAction,
  renderRowActions,
  breadcrumb,
}: CustomFieldGroupListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Zusatzfelder"
        description="Eigene Felder für Tiere und Personen, definiert mit Formularvorlagen"
        breadcrumb={breadcrumb}
        actions={createAction}
      />

      {groups.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListPlus />
            </EmptyMedia>
            <EmptyTitle>Keine Zusatzfelder vorhanden</EmptyTitle>
            <EmptyDescription>
              Lege eine Formularvorlage an und binde sie hier an Tiere oder
              Personen.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        ENTITIES.map((entity) => {
          const entityGroups = groups.filter((g) => g.entity === entity)
          if (entityGroups.length === 0) return null
          return (
            <Card key={entity}>
              <CardHeader>
                <CardTitle>{CUSTOM_FIELD_ENTITY_LABELS[entity]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {CUSTOM_FIELD_SECTIONS[entity].map((section) => {
                  const sectionGroups = entityGroups
                    .filter((g) => g.section === section.value)
                    .sort((a, b) => a.position - b.position)
                  if (sectionGroups.length === 0) return null
                  return (
                    <section key={section.value} className="space-y-2">
                      <h3 className="font-heading text-lg">{section.label}</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Titel</TableHead>
                            <TableHead>Formularvorlage</TableHead>
                            <TableHead>Gilt für</TableHead>
                            <TableHead className="text-right">Felder</TableHead>
                            {renderRowActions && (
                              <TableHead aria-label="Aktionen" />
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sectionGroups.map((group) => (
                            <TableRow key={group.id}>
                              <TableCell className="font-medium">
                                {group.title}
                              </TableCell>
                              <TableCell>{group.form_template.name}</TableCell>
                              <TableCell>{describeGroupScope(group)}</TableCell>
                              <TableCell className="text-right">
                                {group.fields.length}
                              </TableCell>
                              {renderRowActions && (
                                <TableCell className="text-right">
                                  {renderRowActions(group)}
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </section>
                  )
                })}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
