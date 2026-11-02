import { useState, type ReactNode } from 'react'
import type {
  CaseFileField,
  CaseFileGroup,
  CaseFileResource,
} from '@/api/types/case-file'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { Switch } from '@/shadcn/components/ui/switch'
import { Label } from '@/shadcn/components/ui/label'
import { InfoRowEmptyValue } from '@/shadcn/components/common/info-row'
import { cn } from '@/shadcn/lib/utils'
import {
  fieldApplies,
  formatValue,
  isFileField,
  isPresent,
  requirementLabel,
} from '../case-file.utils'

interface CaseFileViewProps {
  caseFile: CaseFileResource
  renderEditGroupAction: (group: CaseFileGroup) => ReactNode
  renderRequirementAction: (field: CaseFileField) => ReactNode
}

/**
 * The "Angaben" tab of an adoption: every group of the animal type's
 * catalogue with the fields that apply, and a menu to jump between groups.
 * How fields are configured lives in the settings; this only shows and
 * edits the values (docs/features/case-file.md#mediator--adoption-page).
 */
export function CaseFileView({
  caseFile,
  renderEditGroupAction,
  renderRequirementAction,
}: CaseFileViewProps) {
  const [onlyOpen, setOnlyOpen] = useState(false)

  const allFields = caseFile.groups.flatMap((group) => group.fields)
  const fieldsByKey = new Map(allFields.map((field) => [field.key, field]))
  const values = Object.fromEntries(allFields.map((f) => [f.key, f.value]))

  const isOpen = (field: CaseFileField) =>
    field.status === 'missing' || field.status === 'awaiting_review'

  const visibleFields = (group: CaseFileGroup) =>
    group.fields.filter(
      (field) =>
        field.type !== 'info' &&
        fieldApplies(field, values, fieldsByKey) &&
        (!onlyOpen || isOpen(field))
    )

  const openCount = (group: CaseFileGroup) =>
    group.fields.filter(
      (field) => fieldApplies(field, values, fieldsByKey) && isOpen(field)
    ).length

  return (
    <div className="xl:grid xl:grid-cols-[200px_1fr] xl:gap-6 space-y-4 xl:space-y-0">
      <nav
        aria-label="Abschnitte"
        className="flex flex-wrap gap-1 xl:flex-col xl:sticky xl:top-6 xl:self-start"
      >
        {caseFile.groups.map((group) => {
          const open = openCount(group)
          return (
            <a
              key={group.id}
              href={`#case-file-group-${group.id}`}
              className="flex items-center justify-between gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {group.title}
              {open > 0 && <Badge variant="warning">{open}</Badge>}
            </a>
          )
        })}
        <div className="flex items-center gap-2 px-3 py-2">
          <Switch
            id="case-file-only-open"
            checked={onlyOpen}
            onCheckedChange={setOnlyOpen}
          />
          <Label htmlFor="case-file-only-open" className="text-sm">
            Nur offene
          </Label>
        </div>
      </nav>

      <div className="space-y-4">
        {caseFile.groups.map((group) => {
          const fields = visibleFields(group)
          if (onlyOpen && fields.length === 0) return null

          return (
            <Card
              key={group.id}
              id={`case-file-group-${group.id}`}
              className="scroll-mt-6"
            >
              <CardHeader>
                <CardTitle>
                  <h2>{group.title}</h2>
                </CardTitle>
                {group.intro && (
                  <CardDescription>{group.intro}</CardDescription>
                )}
                <CardAction>{renderEditGroupAction(group)}</CardAction>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Angaben in diesem Abschnitt.
                  </p>
                ) : (
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                    {fields.map((field) => (
                      <CaseFileFieldRow
                        key={field.key}
                        field={field}
                        requirementAction={renderRequirementAction(field)}
                      />
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
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
  const required = !!field.effective_required_for || !!field.override

  return (
    <div
      className={cn(
        (field.type === 'address' || field.type === 'textarea') &&
          'md:col-span-2'
      )}
    >
      <dt className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wide">
        {field.label}
        {requirementAction}
      </dt>
      <dd className="space-y-1">
        {isFileField(field) && !isPresent(field, field.value) ? (
          <div className="text-sm text-muted-foreground">Keine Datei</div>
        ) : value ? (
          <div className="text-sm font-medium whitespace-pre-line">{value}</div>
        ) : (
          <InfoRowEmptyValue />
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {field.status === 'missing' && <Badge variant="warning">Fehlt</Badge>}
          {field.status === 'awaiting_review' && (
            <Badge variant="info">Prüfung offen</Badge>
          )}
          {field.override && (
            <Badge variant="outline">Für diese Vermittlung angepasst</Badge>
          )}
          {required && (
            <span className="text-xs text-muted-foreground">
              {requirementLabel(field)}
            </span>
          )}
        </div>
      </dd>
    </div>
  )
}
