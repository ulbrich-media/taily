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
import { SelectInput } from '@/components/field/SelectInput.tsx'
import { Textarea } from '@/components/field/Textarea.tsx'
import { FieldGroup } from '@/shadcn/components/ui/field.tsx'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'

const RESULT_OPTIONS = [
  { value: 'not_conducted', label: 'Nicht durchgeführt' },
  { value: 'approved', label: 'Akzeptiert' },
  { value: 'rejected', label: 'Abgelehnt' },
]

const schema = z.object({
  pre_inspection_result: z.enum(['not_conducted', 'approved', 'rejected']),
  pre_inspection_summary: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
  }),
})

type FormData = z.infer<typeof schema>

interface AdoptionEditPreInspectionPageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
}

export function AdoptionEditPreInspectionPage({
  adoption,
  onClose,
}: AdoptionEditPreInspectionPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      pre_inspection_result: adoption.pre_inspection_result,
      pre_inspection_summary: adoption.pre_inspection_summary,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        pre_inspection_result: data.pre_inspection_result,
        pre_inspection_summary: data.pre_inspection_summary.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vorkontrolle erfolgreich aktualisiert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Vorkontrolle')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vorkontrolle bearbeiten</DialogTitle>
          <DialogDescription>
            Erfasse das Ergebnis der Vorkontrolle und eine optionale
            Zusammenfassung.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <SelectInput
              name="pre_inspection_result"
              control={form.control}
              label="Ergebnis"
              required
              options={RESULT_OPTIONS}
            />
            <Textarea
              name="pre_inspection_summary"
              control={form.control}
              label="Zusammenfassung"
              rows={4}
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
