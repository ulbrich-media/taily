import { Button } from '@/shadcn/components/ui/button'
import { DialogFooter } from '@/shadcn/components/ui/dialog'

export function FormFooter({ onClose }: { onClose: () => void }) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onClose}>
        Abbrechen
      </Button>
      <Button type="submit">Übernehmen</Button>
    </DialogFooter>
  )
}
