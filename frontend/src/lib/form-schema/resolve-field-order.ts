import type {
  JsonSchemaProperty,
  UiSchema,
  UiSchemaFieldOptions,
} from '@/api/types/form-schemas'

export function resolveFieldOrder(
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
