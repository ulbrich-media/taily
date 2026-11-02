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
  breadcrumb?: ReactNode
}

/**
 * The contract templates of the installation. Archived templates are no
 * longer offered and require nothing, but stay for the contracts made with
 * them.
 */
export function ContractTemplateListPage({
  templates,
  createAction,
  renderActions,
  breadcrumb,
}: ContractTemplateListPageProps) {
  const [showArchived, setShowArchived] = useState(false)
  const active = templates.filter((template) => !template.archived_at)
  const archived = templates.filter((template) => template.archived_at)

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Verträge"
        description="Vorlagen für den Schutzvertrag. Die Vermittlung wählt beim Erzeugen eine der Vorlagen, die für die Tierart gelten."
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
        <div className="flex flex-wrap gap-1.5">
          {template.archived_at && <Badge variant="outline">Archiviert</Badge>}
          {template.animal_types.map((type) => (
            <Badge key={type.id} variant="secondary">
              {type.title}
            </Badge>
          ))}
        </div>
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
