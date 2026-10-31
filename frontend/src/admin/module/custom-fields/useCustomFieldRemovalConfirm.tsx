import { useRef, useState } from 'react'
import type { CustomFieldRemovalImpact } from '@/api/types/custom-fields'
import { CustomFieldRemovalDialog } from './components/CustomFieldRemovalDialog'
import { runWithRemovalConfirm } from './custom-field-removal'

/**
 * Shared 409 → dialog → resend loop for saves that may delete custom field
 * values (form builder save, field group delete).
 *
 * Usage:
 *   const removal = useCustomFieldRemovalConfirm()
 *   useMutation({ mutationFn: (d) => removal.run((confirm) => save(d, confirm)) })
 *   return <>{...}{removal.dialog}</>
 */
export function useCustomFieldRemovalConfirm() {
  const [impact, setImpact] = useState<CustomFieldRemovalImpact[] | null>(null)
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null)

  const settle = (confirmed: boolean) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setImpact(null)
  }

  const run = <T,>(request: (confirmRemoval: boolean) => Promise<T>) =>
    runWithRemovalConfirm(
      request,
      (nextImpact) =>
        new Promise<boolean>((resolve) => {
          resolveRef.current = resolve
          setImpact(nextImpact)
        })
    )

  const dialog = (
    <CustomFieldRemovalDialog
      impact={impact}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )

  return { run, dialog }
}
