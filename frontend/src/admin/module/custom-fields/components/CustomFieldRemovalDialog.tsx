import { TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { Button } from '@/shadcn/components/ui/button'
import type { CustomFieldRemovalImpact } from '@/api/types/custom-fields'
import { describeRemovalImpact } from '../custom-field-removal'

interface CustomFieldRemovalDialogProps {
  impact: CustomFieldRemovalImpact[] | null
  onConfirm: () => void
  onCancel: () => void
}

export function CustomFieldRemovalDialog({
  impact,
  onConfirm,
  onCancel,
}: CustomFieldRemovalDialogProps) {
  return (
    <AlertDialog open={!!impact} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="text-destructive-text">
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Gespeicherte Werte löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Diese Änderung löscht bereits erfasste Zusatzfeld-Werte. Das kann
            nicht rückgängig gemacht werden.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {impact?.map((item) => (
            <li key={`${item.key}:${item.option ?? ''}`}>
              {describeRemovalImpact(item)}
            </li>
          ))}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Abbrechen</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm}>
            Ja, Werte löschen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
