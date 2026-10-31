import { CircleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/shadcn/components/ui/alert'
import type { CustomFieldMissing } from '@/api/types/custom-fields'

interface ContractMissingFieldsNoticeProps {
  missing:
    | { animal: CustomFieldMissing[]; applicant: CustomFieldMissing[] }
    | undefined
}

/**
 * Notice on the adoption's "Vertrag" step: required custom fields of the
 * animal and the applicant that are still empty. Not a gate.
 */
export function ContractMissingFieldsNotice({
  missing,
}: ContractMissingFieldsNoticeProps) {
  const labels = [
    ...(missing?.animal ?? []).map((f) => `${f.label} (Tier)`),
    ...(missing?.applicant ?? []).map((f) => `${f.label} (Bewerber)`),
  ]
  if (labels.length === 0) return null

  return (
    <Alert className="mb-4">
      <CircleAlert />
      <AlertDescription>
        Vor dem Vertrag fehlen: {labels.join(', ')}
      </AlertDescription>
    </Alert>
  )
}
