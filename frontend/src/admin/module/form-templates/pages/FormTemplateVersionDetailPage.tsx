import { useState, useMemo } from 'react'
import {
  useForm,
  FormProvider,
  type Control,
  type FieldValues,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { RotateCcw, CheckCircle } from 'lucide-react'
import { Badge } from '@/shadcn/components/ui/badge.tsx'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Switch } from '@/shadcn/components/ui/switch.tsx'
import type { FormTemplateVersionResource } from '@/api/types/form-templates.ts'
import type { EditorField } from '../components/shared/EditorField.ts'
import { getFieldTypeDef } from '../components/field-types'
import { parseJsonSchema } from '../components/schema.ts'
import { DynamicFormFields } from '@/components/form/DynamicFormFields.tsx'
import { jsonSchemaToZod } from '@/components/form/jsonSchemaToZod.ts'
import type { JsonSchema } from '@/api/types/form-schemas.ts'
import { CardBox } from '@/shadcn/components/ui/card.tsx'
import {
  Empty,
  EmptyContent,
  EmptyTitle,
} from '@/shadcn/components/ui/empty.tsx'
import { Field, FieldLabel } from '@/shadcn/components/ui/field.tsx'

interface FormTemplateVersionDetailProps {
  version: FormTemplateVersionResource
}

export function FormTemplateVersionDetailPage({
  version,
}: FormTemplateVersionDetailProps) {
  const fields = parseJsonSchema(version.schema, version.ui_schema)
  const [previewMode, setPreviewMode] = useState(false)

  return (
    <div className="space-y-6">
      <div className="self-end flex justify-end">
        <div>
          <Field orientation="horizontal">
            <Switch
              id="field-preview-mode"
              checked={previewMode}
              onCheckedChange={() => setPreviewMode((prev) => !prev)}
            />
            <FieldLabel htmlFor="field-preview-mode">Vorschau</FieldLabel>
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {fields.length === 0 ? (
          <Empty>
            <EmptyContent>
              <EmptyTitle>Diese Version hat keine Felder.</EmptyTitle>
            </EmptyContent>
          </Empty>
        ) : previewMode ? (
          <CardBox className="p-4">
            <FormPreview key={version.id} version={version} />
          </CardBox>
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

// build empty defaults that allow resetting the form properly
function buildEmptyDefaults(
  schema: JsonSchema | null | undefined
): Record<string, unknown> {
  if (!schema?.properties) return {}
  return Object.fromEntries(
    Object.entries(schema.properties).map(([key, prop]) => [
      key,
      prop.type === 'boolean'
        ? false
        : prop.type === 'number' || prop.type === 'integer'
          ? undefined
          : '',
    ])
  )
}

function FormPreview({ version }: { version: FormTemplateVersionResource }) {
  const previewSchema = useMemo(
    () => z.object({ form_data: jsonSchemaToZod(version.schema) }),
    [version.schema]
  )

  const form = useForm({
    resolver: zodResolver(previewSchema) as never,
    defaultValues: { form_data: buildEmptyDefaults(version.schema) },
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => {})} className="space-y-4">
        <DynamicFormFields
          schema={version.schema}
          uiSchema={version.ui_schema}
          control={form.control as unknown as Control<FieldValues>}
          namePrefix="form_data"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              form.reset({
                form_data: buildEmptyDefaults(version.schema),
              })
            }
          >
            <RotateCcw />
            Zurücksetzen
          </Button>
          <Button type="submit">
            <CheckCircle />
            Validieren
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
