import { ClipboardList } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge'
import type { FormTemplateResource } from '@/api/types/form-templates'
import type { EditorField } from './shared/EditorField'
import { getFieldTypeDef } from './field-types'
import { parseJsonSchema } from './schema'

function ReadOnlyFieldCard({ field }: { field: EditorField }) {
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

interface FormTemplateViewerProps {
  template: FormTemplateResource
}

export function FormTemplateViewer({ template }: FormTemplateViewerProps) {
  const fields = parseJsonSchema(template.schema, template.ui_schema)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardList className="size-5 text-primary shrink-0" />
        <h1 className="text-lg font-semibold">Formularvorlage</h1>
      </div>

      {/* Meta card */}
      <div className="rounded-lg border bg-card p-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Name
          </span>
          <p className="text-sm font-medium mt-1">{template.name}</p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Typ
            </span>
            <code className="bg-muted rounded px-2 py-1 text-sm font-mono">
              {template.type}
            </code>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Version
            </span>
            <Badge variant="secondary" className="w-fit">
              v{template.version}
            </Badge>
          </div>
        </div>
      </div>

      {/* Fields */}
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
              Diese Vorlage hat noch keine Felder.
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
