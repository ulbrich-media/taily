import { useEffect, useMemo, useRef } from 'react'
import type { FieldValues, Resolver, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import { jsonSchemaToZod } from '@/components/form/jsonSchemaToZod'
import {
  buildCustomFieldDefaults,
  buildCustomFieldsEditSchema,
  CUSTOM_FIELDS_KEY,
  mergeCustomFieldSchemas,
} from './custom-fields.schema'

/**
 * The resolver of a form with a static zod schema plus the custom fields of
 * `groups`. Without `stored` (create forms), every field is validated. With
 * the record's stored values (edit forms), the schema is rebuilt from the
 * current values on each validation, see buildCustomFieldsEditSchema.
 */
export function useCustomFieldResolver<T extends FieldValues>(
  staticSchema: z.ZodObject<z.ZodRawShape>,
  groups: CustomFieldDefinitionGroup[],
  stored?: Record<string, unknown>
): Resolver<T> {
  return useMemo(() => {
    if (!stored) {
      return zodResolver(
        staticSchema.extend({
          [CUSTOM_FIELDS_KEY]: jsonSchemaToZod(mergeCustomFieldSchemas(groups)),
        })
      ) as never
    }

    const resolver: Resolver<T> = (values, context, options) => {
      const current = (values[CUSTOM_FIELDS_KEY] ?? {}) as Record<
        string,
        unknown
      >
      return zodResolver(
        staticSchema.extend({
          [CUSTOM_FIELDS_KEY]: buildCustomFieldsEditSchema(
            groups,
            current,
            stored
          ),
        })
      )(values, context, options as never) as never
    }
    return resolver
  }, [staticSchema, groups, stored])
}

function groupsSignature(groups: CustomFieldDefinitionGroup[]) {
  return groups
    .map((g) => `${g.id}:${g.template.version_id}:${g.in_scope}`)
    .join('|')
}

/**
 * Rebuilds the `custom_fields` defaults when the shown groups change after
 * mount (e.g. the animal type changes on the create page, or definitions are
 * re-queried after a save). Values already entered for keys that still exist
 * are kept; `stored` provides the record's saved values.
 */
export function useSyncCustomFieldDefaults<T extends FieldValues>(
  form: UseFormReturn<T>,
  groups: CustomFieldDefinitionGroup[],
  stored: Record<string, unknown> | undefined
) {
  const signature = groupsSignature(groups)
  const latest = useRef({ groups, stored })
  const previousSignature = useRef(signature)

  useEffect(() => {
    latest.current = { groups, stored }
  })

  useEffect(() => {
    if (previousSignature.current === signature) return
    previousSignature.current = signature

    const looseForm = form as unknown as UseFormReturn<FieldValues>
    const current = (looseForm.getValues(CUSTOM_FIELDS_KEY) ?? {}) as Record<
      string,
      unknown
    >
    looseForm.resetField(CUSTOM_FIELDS_KEY, {
      defaultValue: buildCustomFieldDefaults(latest.current.groups, {
        ...latest.current.stored,
        ...current,
      }),
    })
  }, [form, signature])
}
