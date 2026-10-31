import { ApiValidationError } from '@/lib/api'
import type { CustomFieldRemovalImpact } from '@/api/types/custom-fields'

/** Thrown when the user declines a removal; callers usually ignore it. */
export class CustomFieldRemovalCancelledError extends Error {
  constructor() {
    super('Löschen der Zusatzfeld-Werte abgebrochen')
    this.name = 'CustomFieldRemovalCancelledError'
  }
}

export function isCustomFieldRemovalCancelled(error: unknown): boolean {
  return error instanceof CustomFieldRemovalCancelledError
}

/** The removal impact of a 409 answer, or null for any other error. */
export function getRemovalImpact(
  error: unknown
): CustomFieldRemovalImpact[] | null {
  if (!(error instanceof ApiValidationError) || error.status !== 409) {
    return null
  }
  const impact = error.body?.removal_impact
  return Array.isArray(impact) ? (impact as CustomFieldRemovalImpact[]) : null
}

/**
 * The 409 → confirm → resend loop: sends the request without the flag; if
 * the backend answers with a removal impact, asks for confirmation and sends
 * the same request again with `confirm_custom_field_removal: true`.
 *
 * Rejects with CustomFieldRemovalCancelledError when the user declines.
 */
export async function runWithRemovalConfirm<T>(
  request: (confirmRemoval: boolean) => Promise<T>,
  confirm: (impact: CustomFieldRemovalImpact[]) => Promise<boolean>
): Promise<T> {
  try {
    return await request(false)
  } catch (error) {
    const impact = getRemovalImpact(error)
    if (!impact) throw error

    if (!(await confirm(impact))) {
      throw new CustomFieldRemovalCancelledError()
    }
    return await request(true)
  }
}

export function describeRemovalImpact(impact: CustomFieldRemovalImpact) {
  const recordsLabel =
    impact.count === 1 ? 'einem Eintrag' : `${impact.count} Einträgen`
  return impact.option !== null
    ? `${impact.label}: Wert „${impact.option}“ wird bei ${recordsLabel} gelöscht.`
    : `${impact.label} wird bei ${recordsLabel} gelöscht.`
}
