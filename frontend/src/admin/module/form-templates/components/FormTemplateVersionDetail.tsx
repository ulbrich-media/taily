import { Badge } from '@/shadcn/components/ui/badge'
import type { FormTemplateVersionResource } from '@/api/types/form-templates'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'
import { parseJsonSchema } from './schema'
import { formatApiDate } from '@/lib/dates.utils'

export function ReadOnlyFieldCard({ field }: { field: EditorField }) {
  const def = getFieldTypeDef(field.type)
  const Icon = def.icon
  const chips = def.settingsChips(field.settings)

  return (
    <div className="flex items-center gap-3 rounded-md border bg-card p-3">
      <Icon className="size-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{field.label}</span>
          <code className="text-[10px] font-mono text-muted-foreground bg-muted rounded px-1 py-0.5">
            {field.id}
          </code>
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {field.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge variant="secondary" className="text-xs h-4 px-1.5">
            {def.label}
          </Badge>
          {field.required && (
            <Badge variant="outline" className="text-xs h-4 px-1.5">
              Pflichtfeld
            </Badge>
          )}
          {chips.map((chip) => (
            <Badge
              key={chip}
              variant="outline"
              className="text-xs h-4 px-1.5 text-muted-foreground bg-muted/50"
            >
              {chip}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

interface FormTemplateVersionDetailProps {
  version: FormTemplateVersionResource
}

export function FormTemplateVersionDetail({
  version,
}: FormTemplateVersionDetailProps) {
  const fields = parseJsonSchema(version.schema, version.ui_schema)

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4 grid grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Einreichungen
          </span>
          <p className="text-sm font-medium mt-1">
            {version.submissions_count}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Erstellt
          </span>
          <p className="text-sm font-medium mt-1">
            {formatApiDate(version.created_at)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Formularfelder
          {fields.length > 0 && (
            <span className="ml-1.5 font-normal normal-case">
              ({fields.length})
            </span>
          )}
        </p>
        {fields.length === 0 ? (
          <div className="flex items-center justify-center border-2 border-dashed rounded-md p-8">
            <p className="text-sm text-muted-foreground">
              Diese Version hat keine Felder.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {fields.map((field) => (
              <ReadOnlyFieldCard key={field.id} field={field} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
