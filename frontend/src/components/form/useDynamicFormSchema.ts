import { useMemo } from 'react'
import { z } from 'zod'
import { jsonSchemaToZod } from './jsonSchemaToZod'

/**
 * Merges a static Zod schema with a dynamic `form_data` schema derived from a
 * JSON Schema. Use this whenever a page combines fixed fields with a
 * DynamicFormFields section so both layers are validated by the same resolver.
 *
 * Accepts the same Record<string, unknown> the API returns — no cast needed.
 *
 * Usage:
 *   const schema = useDynamicFormSchema(staticSchema, template?.schema)
 *   const form = useForm({ resolver: zodResolver(schema) as never, ... })
 */
export function useDynamicFormSchema<T extends z.ZodObject<z.ZodRawShape>>(
  staticSchema: T,
  jsonSchema: Record<string, unknown> | null | undefined
) {
  return useMemo(
    () => staticSchema.extend({ form_data: jsonSchemaToZod(jsonSchema) }),
    // staticSchema is always a module-level constant — only jsonSchema varies
    [staticSchema, jsonSchema]
  )
}
