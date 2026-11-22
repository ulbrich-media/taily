import type { ReactNode } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CatalogueGroup } from '@/api/types/case-file-catalogue'
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
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { Textarea } from '@/components/field/Textarea'
import { zFieldString } from '@/components/field/TextInput.utils'
import { createFieldGroup, updateFieldGroup } from '../api/requests'
import { useCatalogueMutation } from '../useCatalogueMutation'

const schema = z.object({
  title: zFieldString({ required: true }),
  intro: zFieldString({ maxLength: 2000 }),
})

type FormData = z.infer<typeof schema>

interface FieldGroupDialogProps {
  animalTypeId: string
  // Absent when creating a new group.
  group?: CatalogueGroup
  onClose: () => void
  breadcrumb?: ReactNode
}

export function FieldGroupDialog({
  animalTypeId,
  group,
  onClose,
  breadcrumb,
}: FieldGroupDialogProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: group?.title ?? '', intro: group?.intro ?? '' },
  })

  const mutation = useCatalogueMutation(
    animalTypeId,
    (data: FormData) =>
      group
        ? updateFieldGroup(group.id, data)
        : createFieldGroup(animalTypeId, data),
    onClose
  )

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {group ? 'Abschnitt bearbeiten' : 'Neuer Abschnitt'}
          </DialogTitle>
          <DialogDescription>
            Abschnitte bestimmen, wo ein Feld erscheint – in Formularen, im
            Bewerberportal und auf der Vermittlung.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(async (data) => {
              // Awaited, so FormBlocker lets the closing navigation pass.
              try {
                await mutation.mutateAsync(data)
                form.reset(data)
              } catch {
                // Shown as a toast by the mutation.
              }
            })}
            className="space-y-4"
          >
            <FormBlocker />
            <FieldGroup>
              <TextInput
                name="title"
                control={form.control}
                label="Titel"
                required
              />
              <Textarea
                name="intro"
                control={form.control}
                label="Einleitung"
                description="Optional. Wird über den Feldern des Abschnitts angezeigt."
                rows={3}
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
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Speichern...' : 'Speichern'}
              </Button>
            </DialogFooter>
            <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
