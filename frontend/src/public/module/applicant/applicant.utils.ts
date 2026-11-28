import {
  ADOPTION_STEP_LABELS,
  stepReached,
  type AdoptionStep,
} from '@/api/types/case-file'
import type { ApplicantField } from './api/types'

/**
 * "Pflicht" for what is needed now, "Für den Vertrag nötig" for what is
 * asked early but needed later.
 */
export function applicantRequirement(
  field: ApplicantField,
  currentStep: AdoptionStep
): string {
  const step = field.effective_required_for
  if (!step) return ''
  return stepReached(currentStep, step)
    ? 'Pflicht'
    : `Nötig für: ${ADOPTION_STEP_LABELS[step]}`
}
