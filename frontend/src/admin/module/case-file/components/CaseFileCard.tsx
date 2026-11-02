import { useState, type ReactNode } from 'react'
import type {
  CaseFileField,
  CaseFileGroup,
  CaseFileResource,
  ChecklistItem,
} from '@/api/types/case-file'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { Switch } from '@/shadcn/components/ui/switch'
import { Label } from '@/shadcn/components/ui/label'
import { InfoRowEmptyValue } from '@/shadcn/components/common/info-row'
import { ChecklistSummary } from './ChecklistSummary'
import {
  fieldApplies,
  formatValue,
  isFileField,
  isPresent,
  requirementLabel,
} from '../case-file.utils'

interface CaseFileCardProps {
  caseFile: CaseFileResource
  renderEditGroupAction: (group: CaseFileGroup) => ReactNode
  renderRequirementAction: (field: CaseFileField) => ReactNode
  renderChecklistItemAction?: (item: ChecklistItem) => ReactNode
}

/**
 * The adoption's Case File for the mediator: the checklist per step on top,
 * then every group of the catalogue with the fields that apply
 * (docs/features/case-file.md#mediator--adoption-page).
 */
export function CaseFileCard({
  caseFile,
  renderEditGroupAction,
  renderRequirementAction,
  renderChecklistItemAction,
}: CaseFileCardProps) {
  const [onlyOpen, setOnlyOpen] = useState(false)

  const allFields = caseFile.groups.flatMap((group) => group.fields)
  const fieldsByKey = new Map(allFields.map((field) => [field.key, field]))
  const values = Object.fromEntries(allFields.map((f) => [f.key, f.value]))

  const visibleFields = (group: CaseFileGroup) =>
    group.fields.filter((field) => {
      if (!fieldApplies(field, values, fieldsByKey)) return false
      if (!onlyOpen) return true
      return field.status === 'missing' || field.status === 'awaiting_review'
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Angaben</CardTitle>
        <CardDescription>
          Alles, was für diese Vermittlung über die Bewerber:in bekannt ist.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChecklistSummary
          checklists={caseFile.checklists}
          renderItemAction={renderChecklistItemAction}
        />

        <div className="flex items-center gap-2">
          <Switch
            id="case-file-only-open"
            checked={onlyOpen}
            onCheckedChange={setOnlyOpen}
          />
          <Label htmlFor="case-file-only-open">Nur offene Angaben</Label>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {caseFile.groups.map((group) => (
            <a
              key={group.id}
              href={`#case-file-group-${group.id}`}
              className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              {group.title}
            </a>
          ))}
        </nav>

        {caseFile.groups.map((group) => {
          const fields = visibleFields(group)
          if (onlyOpen && fields.length === 0) return null

          return (
            <section
              key={group.id}
              id={`case-file-group-${group.id}`}
              className="space-y-3 scroll-mt-24"
            >
              <div className="flex items-start justify-between gap-3 border-b pb-2">
                <div>
                  <h3 className="font-heading text-lg">{group.title}</h3>
                  {group.intro && (
                    <p className="text-sm text-muted-foreground">
                      {group.intro}
                    </p>
                  )}
                </div>
                {renderEditGroupAction(group)}
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {fields.map((field) =>
                  field.type === 'info' ? null : (
                    <CaseFileFieldRow
                      key={field.key}
                      field={field}
                      requirementAction={renderRequirementAction(field)}
                    />
                  )
                )}
              </dl>
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}

function CaseFileFieldRow({
  field,
  requirementAction,
}: {
  field: CaseFileField
  requirementAction: ReactNode
}) {
  const value = formatValue(field, field.value)
  const overridden = field.override !== null

  return (
    <div className={field.type === 'address' ? 'md:col-span-2' : undefined}>
      <dt className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex flex-wrap items-center gap-1">
        {field.label}
      </dt>
      <dd className="space-y-1">
        {isFileField(field) && !isPresent(field, field.value) ? (
          <div className="text-sm text-muted-foreground">Keine Datei</div>
        ) : value ? (
          <div className="text-sm font-medium whitespace-pre-line">{value}</div>
        ) : (
          <InfoRowEmptyValue />
        )}
        <div className="flex flex-wrap items-center gap-1">
          <FieldStatusBadge field={field} />
          <Badge variant={overridden ? 'info' : 'outline'}>
            {requirementLabel(field)}
          </Badge>
          {field.in_contract && <Badge variant="outline">Im Vertrag</Badge>}
          {!field.visible_to_inspector && (
            <Badge variant="outline">Nicht für Kontrolleure</Badge>
          )}
          {requirementAction}
        </div>
      </dd>
    </div>
  )
}

function FieldStatusBadge({ field }: { field: CaseFileField }) {
  if (field.status === 'missing') {
    return <Badge variant="warning">Fehlt</Badge>
  }
  if (field.status === 'awaiting_review') {
    return <Badge variant="info">Prüfung offen</Badge>
  }
  if (field.requires_review && field.review_status === 'confirmed') {
    return <Badge variant="success">Geprüft</Badge>
  }
  return null
}
