import type { ReactNode } from 'react'
import type { FormTemplateResource } from '@/api/types/form-templates'
import { Badge } from '@/shadcn/components/ui/badge'
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
import { formatApiDate } from '@/lib/dates.utils.ts'

interface FormTemplateViewProps {
  templates: FormTemplateResource[]
  renderRowActions: (template: FormTemplateResource) => ReactNode
}

export function FormTemplateList({
  templates,
  renderRowActions,
}: FormTemplateViewProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Version</TableHead>
          <TableHead>Zuletzt geändert</TableHead>
          <TableHead className="th-contain"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TableRow key={template.id}>
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
  )
}

export function FormTemplateCardGrid({
  templates,
  renderRowActions,
  className,
}: FormTemplateViewProps & { className?: string }) {
  return (
    <ListCardGrid
      items={templates}
      getKey={(template) => template.id}
      className={className}
    >
      {(template) => (
        <ListCard
          header={<p className="font-medium">{template.name}</p>}
          footer={renderRowActions(template)}
        >
          <InfoRow label="Version">
            <Badge variant="secondary">v{template.version}</Badge>
          </InfoRow>
          <InfoRow label="Zuletzt geändert">
            {formatApiDate(template.updated_at)}
          </InfoRow>
        </ListCard>
      )}
    </ListCardGrid>
  )
}
