import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  Dialog,
  DialogBreadcrumb,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { SelectInput } from '@/components/field/SelectInput'
import { copyCatalogue } from '../api/requests'
import { useCatalogueMutation } from '../useCatalogueMutation'

interface CatalogueCopyDialogProps {
  animalType: { id: string; title: string }
  animalTypes: AnimalTypeResource[]
  onClose: () => void
  breadcrumb?: ReactNode
}

/**
 * Replaces this animal type's catalogue with a copy of another's — the quick
 * start for a new animal type. Refused once adoptions hold data for it.
 */
export function CatalogueCopyDialog({
  animalType,
  animalTypes,
  onClose,
  breadcrumb,
}: CatalogueCopyDialogProps) {
  const sources = animalTypes.filter((type) => type.id !== animalType.id)
  const form = useForm<{ from: string }>({
    defaultValues: { from: sources[0]?.id ?? '' },
  })

  const mutation = useCatalogueMutation(
    animalType.id,
    ({ from }: { from: string }) => copyCatalogue(animalType.id, from),
    onClose
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Angaben von anderer Tierart kopieren</DialogTitle>
          <DialogDescription>
            Ersetzt alle Abschnitte und Felder von {animalType.title} durch eine
            Kopie. Das geht nur, solange noch keine Vermittlung Angaben für{' '}
            {animalType.title} enthält.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectInput
              name="from"
              control={form.control}
              label="Kopieren von"
              options={sources.map((type) => ({
                value: type.id,
                label: type.title,
              }))}
              required
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={mutation.isPending || !sources.length}
            >
              Katalog ersetzen
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
