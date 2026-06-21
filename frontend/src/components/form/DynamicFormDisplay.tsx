import type {
  JsonSchema,
  JsonSchemaProperty,
  UiSchema,
  UiSchemaFieldOptions,
} from '@/api/types/form-schemas'

interface DynamicFormDisplayProps {
  schema: JsonSchema
  uiSchema?: UiSchema
  data: Record<string, unknown>
}

function resolveFieldOrder(
  properties: Record<string, JsonSchemaProperty>,
  uiOrder: string[] | undefined,
  uiSchema: UiSchema = {}
): string[] {
  if (uiOrder && uiOrder.length > 0) {
    const inOrder = uiOrder.filter(
      (k) =>
        k in properties ||
        (uiSchema[k] as UiSchemaFieldOptions)?.['ui:widget'] === 'heading'
    )
    const rest = Object.keys(properties).filter((k) => !uiOrder.includes(k))
    return [...inOrder, ...rest]
  }
  return Object.keys(properties)
}

function formatValue(
  key: string,
  prop: JsonSchemaProperty,
  uiOptions: UiSchemaFieldOptions,
  data: Record<string, unknown>
): string {
  const raw = data[key]

  if (raw === undefined || raw === null || raw === '') return '–'

  // Boolean
  if (prop.type === 'boolean') return raw ? 'Ja' : 'Nein'

  // Enum with labels
  if (prop.enum) {
    const labelMap = uiOptions['ui:options']?.labels
    if (labelMap) {
      const match = labelMap.find((l) => l.value === String(raw))
      if (match) return match.label
    }
    return String(raw)
  }

  return String(raw)
}

export function DynamicFormDisplay({
  schema,
  uiSchema = {},
  data,
}: DynamicFormDisplayProps) {
  if (!schema.properties) return null

  const uiOrder = uiSchema['ui:order'] as string[] | undefined
  const orderedKeys = resolveFieldOrder(schema.properties, uiOrder, uiSchema)

  return (
    <dl className="space-y-3">
      {orderedKeys.map((key) => {
        const prop = schema.properties?.[key] ?? {}
        const uiOptions = (uiSchema[key] ?? {}) as UiSchemaFieldOptions
        const title = uiOptions['ui:title'] ?? prop.type ?? key
        const widget = uiOptions['ui:widget']

        if (prop.type === 'null' || widget === 'heading') {
          return (
            <h3 key={key} className="text-sm font-semibold pt-2">
              {title}
            </h3>
          )
        }

        return (
          <div key={key}>
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">
              {title}
            </dt>
            <dd className="text-sm font-medium mt-0.5">
              {formatValue(key, prop, uiOptions, data)}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
