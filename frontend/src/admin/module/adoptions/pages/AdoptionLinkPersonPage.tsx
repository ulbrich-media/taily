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
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { updateAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { PersonSelect } from '@/components/field/PersonSelect.tsx'
import { z } from 'zod'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import type { PersonListResource } from '@/api/types/people'

const schema = z.object({
  applicant_person_id: z.string().nullable(),
})

type FormData = z.infer<typeof schema>

interface AdoptionLinkPersonPageProps {
  adoption: AdoptionDetailResource
  persons: PersonListResource[]
  onClose: () => void
  breadcrumb?: ReactNode
}

/**
 * References a Person Taily already manages — e.g. a foster carer adopting
 * their foster animal. Only the reference changes; the applicant's data on
 * the adoption stays as it is (ADR-018).
 */
export function AdoptionLinkPersonPage({
  adoption,
  persons,
  onClose,
  breadcrumb,
}: AdoptionLinkPersonPageProps) {
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicant_person_id: adoption.applicant_person_id,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateAdoption(adoption.id, {
        applicant_person_id: data.applicant_person_id,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      queryClient.invalidateQueries({
        queryKey: adoptionQueryKeys.detail(adoption.id),
      })
      toast.success(response.message || 'Vermittlung erfolgreich aktualisiert')
      onClose()
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren der Vermittlung')
    },
  })

  const handleSubmit = (data: FormData) => {
    updateMutation.mutate(data)
  }

  return (
    <Dialog
      open
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          onClose()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mit Person verknüpfen</DialogTitle>
          <DialogDescription>
            Verknüpft {adoption.applicant.full_name} mit einer Person, die Taily
            bereits kennt. Die Angaben der Vermittlung bleiben unverändert.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <PersonSelect
            name="applicant_person_id"
            control={form.control}
            label="Person"
            persons={persons}
            renderSubline={(person) => person.email}
            canRemove
          />
          <DialogFooter>
            <Button type="submit" disabled={updateMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}
