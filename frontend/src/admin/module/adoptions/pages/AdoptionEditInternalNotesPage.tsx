import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
})

type FormData = z.infer<typeof schema>

interface AdoptionEditInternalNotesPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionEditInternalNotesPage({
  adoption,
  onClose,
}: AdoptionEditInternalNotesPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      notes: adoption.notes,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        notes: data.notes.trim(),
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
              label="Notizen"
              rows={5}
            />
          </FieldGroup>
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
