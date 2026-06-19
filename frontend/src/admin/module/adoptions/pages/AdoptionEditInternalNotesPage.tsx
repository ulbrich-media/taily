import { type ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogBreadcrumb,
} from '@/shadcn/components/ui/dialog.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Textarea } from '@/components/field/Textarea.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'

const schema = z.object({
  notes: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
  }),
  canceledReason: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
  }),
})

type FormData = z.infer<typeof schema>

interface AdoptionEditInternalNotesPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AdoptionEditInternalNotesPage({
  adoption,
  onClose,
  breadcrumb,
}: AdoptionEditInternalNotesPageProps) {
  const queryClient = useQueryClient()
  const isCanceled = adoption.status === 'canceled'

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: adoption.notes,
      canceledReason: adoption.canceled_reason,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        notes: data.notes.trim(),
        canceled_reason: data.canceledReason.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Notizen erfolgreich gespeichert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Notizen')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
          <DialogTitle>Notizen</DialogTitle>
          <DialogDescription>
            Notizen zur Vermittlung festhalten.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <Textarea
              name="notes"
              control={form.control}
              label="Allgemeine Notizen"
              rows={5}
            />
          </FieldGroup>
          {isCanceled && (
            <FieldGroup>
              <Textarea
                name="canceledReason"
                control={form.control}
                label="Grund für den Abbruch"
                rows={5}
              />
            </FieldGroup>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
