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
    const rest = Object.keys(properties).filter((k) => !uiOrder.includes(k))
    const starIndex = uiOrder.indexOf('*')

    const isKnown = (k: string) =>
      k in properties ||
      (uiSchema[k] as UiSchemaFieldOptions)?.['ui:widget'] === 'heading'

    if (starIndex !== -1) {
      const before = uiOrder.slice(0, starIndex).filter(isKnown)
      const after = uiOrder.slice(starIndex + 1).filter(isKnown)
      return [...before, ...rest, ...after]
    }

    return [...uiOrder.filter(isKnown), ...rest]
  }
  return Object.keys(properties)
}
