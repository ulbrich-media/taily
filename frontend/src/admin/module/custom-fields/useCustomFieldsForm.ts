import { useEffect, useMemo, useRef } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import type { CustomFieldDefinitionGroup } from '@/api/types/custom-fields'
import {
  buildCustomFieldDefaults,
  CUSTOM_FIELDS_KEY,
  mergeCustomFieldSchemas,
} from './custom-fields.schema'

/** The merged JSON Schema of a section's groups, stable while the groups are. */
export function useMergedCustomFieldSchema(
  groups: CustomFieldDefinitionGroup[]
) {
  return useMemo(() => mergeCustomFieldSchemas(groups), [groups])
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
