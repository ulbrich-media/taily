import { ApiValidationError } from '@/lib/api'
import { CUSTOM_FIELDS_KEY } from './custom-fields.schema'

type SetError = (
  name: `${typeof CUSTOM_FIELDS_KEY}.${string}`,
  error: { type: string; message: string }
) => void

/**
 * Maps 422 errors on `custom_fields.<key>` onto the form fields. Client-side
 * zod covers the normal case; the server stays authoritative, e.g. after a
 * concurrent template edit.
 *
 * Returns true when at least one error was mapped.
 */
export function applyCustomFieldErrors(
  error: unknown,
  setError: SetError
): boolean {
  if (!(error instanceof ApiValidationError) || !error.errors) return false

  let mapped = false
  for (const [name, messages] of Object.entries(error.errors)) {
    if (!name.startsWith(`${CUSTOM_FIELDS_KEY}.`) || !messages?.length) continue
    setError(name as `${typeof CUSTOM_FIELDS_KEY}.${string}`, {
      type: 'server',
      message: messages[0],
    })
    mapped = true
  }
  return mapped
}
