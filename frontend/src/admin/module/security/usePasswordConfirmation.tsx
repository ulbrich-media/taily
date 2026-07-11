import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PasswordConfirmationDialog } from '@/admin/module/security/components/PasswordConfirmationDialog'
import { getConfirmedPasswordStatus } from '@/admin/module/security/api/requests'

interface UsePasswordConfirmationResult {
  /**
   * Ensure the password has been confirmed recently, prompting for it if not.
   * Resolves `true` once confirmation is in place, or `false` if the user
   * cancels the prompt. Callers run the guarded action only on `true`.
   */
  ensureConfirmed: () => Promise<boolean>
  /** The confirmation dialog element; render it once in the component tree. */
  dialog: React.ReactNode
}

/**
 * Gate sensitive actions behind a fresh password confirmation. Checks the
 * server-side confirmation status first, so the user is only prompted when a
 * new confirmation is actually required (it stays valid for the configured
 * window).
 */
export function usePasswordConfirmation(): UsePasswordConfirmationResult {
  const [open, setOpen] = useState(false)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const settle = useCallback((confirmed: boolean) => {
    setOpen(false)
    resolverRef.current?.(confirmed)
    resolverRef.current = null
  }, [])

  const ensureConfirmed = useCallback(async () => {
    try {
      const { confirmed } = await getConfirmedPasswordStatus()
      if (confirmed) {
        return true
      }
    } catch {
      toast.error('Der Bestätigungsstatus konnte nicht geprüft werden.')
      return false
    }

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setOpen(true)
    })
  }, [])

  const dialog = (
    <PasswordConfirmationDialog
      open={open}
      onConfirmed={() => settle(true)}
      onCancel={() => settle(false)}
    />
  )

  return { ensureConfirmed, dialog }
}
