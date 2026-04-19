import type { ReactNode } from 'react'
import { ClipboardList } from 'lucide-react'
import type { FormTemplateResource } from '@/api/types/form-templates'
import { PageHeader } from '@/components/layout/PageHeader'
import { TableListView } from '@/components/list/TableListView'
import { Badge } from '@/shadcn/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table'
import { formatApiDate } from '@/lib/dates.utils.ts'

interface FormTemplateResourceListPageProps {
  templates: FormTemplateResource[]
  createAction?: ReactNode
  renderRowActions: (template: FormTemplateResource) => ReactNode
}

export function FormTemplateListPage({
  templates,
  createAction,
  renderRowActions,
}: FormTemplateResourceListPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Formularvorlagen"
        description="Verwalte dynamische Formularvorlagen für Inspektionen, Bewerbungen und mehr"
        actions={createAction}
      />

      <TableListView
        data={templates}
        emptyState={{
          title: 'Keine Formularvorlagen vorhanden',
          description: 'Erstelle die erste Formularvorlage!',
        }}
      >
        {(templates) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Zuletzt geändert</TableHead>
                <TableHead className="th-contain"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <code className="bg-muted rounded px-1.5 py-0.5 text-sm font-mono">
                      {template.type}
                    </code>
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">v{template.version}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatApiDate(template.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderRowActions(template)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableListView>
    </div>
  )
}
