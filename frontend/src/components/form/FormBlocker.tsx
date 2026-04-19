import { useBlocker } from '@tanstack/react-router'
import { useFormState } from 'react-hook-form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { SaveOff } from 'lucide-react'

interface FormBlockerProps {
  /**
   * Additional dirty state outside of react-hook-form (e.g. custom editor state).
   * The blocker activates when either this OR the form's own isDirty is true.
   * Omit for standard forms — FormBlocker reads isDirty and isSubmitting from
   * the nearest FormProvider automatically.
   */
  isDirty?: boolean

  /**
   * Custom warning message to display
   */
  message?: string
}

/**
 * FormBlocker component that prevents navigation when there are unsaved changes.
 * Must be rendered inside a react-hook-form FormProvider.
 */
export function FormBlocker({
  isDirty: extraDirty = false,
  message = 'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?',
}: FormBlockerProps) {
  const { isDirty, isSubmitting } = useFormState()

  const shouldBlock = (isDirty || extraDirty) && !isSubmitting

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => shouldBlock,
    withResolver: true,
  })

  return (
    <AlertDialog
      open={status === 'blocked'}
      onOpenChange={(open) => !open && reset?.()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <SaveOff />
          </AlertDialogMedia>
          <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={reset}>
            Auf der Seite bleiben
          </AlertDialogCancel>
          <AlertDialogAction onClick={proceed} variant="destructive">
            Seite verlassen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
