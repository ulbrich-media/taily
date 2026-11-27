import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, FileSignature } from 'lucide-react'
import {
  CONTRACT_SECTIONS,
  type ContractTemplateResource,
} from '@/api/types/contract-templates'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { Button } from '@/shadcn/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shadcn/components/ui/empty'
import { SECTION_LABELS, fieldSummary } from '../contract-templates.utils'

interface ContractTemplateListPageProps {
  templates: ContractTemplateResource[]
  createAction: ReactNode
  renderActions: (template: ContractTemplateResource) => ReactNode
}

/**
 * The contract templates of one animal type. Archived templates are no
 * longer offered and require nothing, but stay for the contracts made with
 * them.
 */
export function ContractTemplateListPage({
  templates,
  createAction,
  renderActions,
}: ContractTemplateListPageProps) {
  const [showArchived, setShowArchived] = useState(false)
  const active = templates.filter((template) => !template.archived_at)
  const archived = templates.filter((template) => template.archived_at)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verträge"
        description="Vorlagen für den Schutzvertrag. Die Vermittlung wählt beim Erzeugen eine der Vorlagen dieser Tierart."
        actions={createAction}
      />

      {active.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileSignature />
            </EmptyMedia>
            <EmptyTitle>Keine Vertragsvorlage</EmptyTitle>
            <EmptyDescription>
              Ohne Vorlage kann kein Vertrag erzeugt werden.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {active.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          actions={renderActions(template)}
        />
      ))}

      {archived.length > 0 && (
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowArchived((show) => !show)}
          >
            {showArchived ? <ChevronDown /> : <ChevronRight />}
            {archived.length} archiviert
          </Button>
          {showArchived &&
            archived.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                actions={renderActions(template)}
              />
            ))}
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  actions,
}: {
  template: ContractTemplateResource
  actions: ReactNode
}) {
  return (
    <Card className={template.archived_at ? 'opacity-70' : undefined}>
      <CardHeader>
        <CardTitle>{template.name}</CardTitle>
        <CardDescription>Titel: {template.title}</CardDescription>
        <CardAction className="flex flex-wrap justify-end gap-1">
          {actions}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {template.archived_at && (
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">Archiviert</Badge>
          </div>
        )}
        <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
          {CONTRACT_SECTIONS.map((section) => (
            <div key={section}>
              <dt className="text-muted-foreground">
                {SECTION_LABELS[section]}
              </dt>
              <dd>{fieldSummary(template[`${section}_fields`])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
