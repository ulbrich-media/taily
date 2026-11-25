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
import { declineAdoption } from '@/admin/module/adoptions/api/requests.ts'
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
  internal_reason: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
    required: true,
  }),
  applicant_reason: zFieldString({
    maxLength: STRING_LENGTH_TEXTAREA,
    required: false,
  }),
})

type FormData = z.infer<typeof schema>

interface AdoptionDeclinePageProps {
  adoption: AdoptionDetailResource
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AdoptionDeclinePage({
  adoption,
  onClose,
  breadcrumb,
}: AdoptionDeclinePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { internal_reason: '', applicant_reason: '' },
  })

  const declineMutation = useMutation({
    mutationFn: (data: FormData) =>
      declineAdoption(adoption.id, {
        internal_reason: data.internal_reason.trim(),
        applicant_reason: data.applicant_reason.trim(),
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Bewerbung abgelehnt')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Ablehnen der Bewerbung')
    },
  })

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bewerbung ablehnen</DialogTitle>
          <DialogDescription>
            Die Vermittlung wird abgebrochen und die Bewerber:in per E-Mail
            informiert.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => declineMutation.mutate(data))}
          className="space-y-4"
        >
          <FieldGroup>
            <Textarea
              name="internal_reason"
              control={form.control}
              label="Interner Grund"
              required
              description="Wird bei der Vermittlung gespeichert und nicht an die Bewerber:in gesendet."
              rows={3}
            />
            <Textarea
              name="applicant_reason"
              control={form.control}
              label="Grund für die Bewerber:in"
              description="Wird in der E-Mail an die Bewerber:in mitgeschickt."
              rows={3}
            />
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={declineMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={declineMutation.isPending}
            >
              {declineMutation.isPending
                ? 'Wird abgelehnt...'
                : 'Bewerbung ablehnen'}
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
