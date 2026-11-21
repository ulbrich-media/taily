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
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAdoption } from '@/admin/module/adoptions/api/requests.ts'
import { adoptionQueryKeys } from '@/admin/module/adoptions/api/queries.ts'
import { toast } from 'sonner'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { AnimalSelect } from '@/components/field/AnimalSelect.tsx'
import { PersonSelect } from '@/components/field/PersonSelect.tsx'
import { TextInput } from '@/components/field/TextInput'
import { FieldGroup, FieldLabel } from '@/shadcn/components/ui/field'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/shadcn/components/ui/toggle-group'
import { ApiValidationError } from '@/lib/api'
import { z } from 'zod'
import type { PersonListResource } from '@/api/types/people'
import type { CreateAdoptionRequest } from '@/admin/module/adoptions/api/types'

// The applicant's data belongs to the adoption (ADR-018): entered here, or
// copied once from a person Taily already knows, who is then referenced.
const adoptionCreateSchema = z
  .object({
    animal_id: z.string().min(1, 'Pflichtfeld'),
    mediator_id: z.string().nullable(),
    applicant_source: z.enum(['new', 'person']),
    applicant_person_id: z.string(),
    applicant_first_name: z.string(),
    applicant_last_name: z.string(),
    applicant_email: z.union([z.literal(''), z.email('Keine gültige E-Mail')]),
    applicant_phone: z.string(),
  })
  .superRefine((data, ctx) => {
    const required = (path: keyof typeof data) =>
      ctx.addIssue({ code: 'custom', path: [path], message: 'Pflichtfeld' })
    if (data.applicant_source === 'person') {
      if (!data.applicant_person_id) required('applicant_person_id')
      return
    }
    if (!data.applicant_first_name.trim()) required('applicant_first_name')
    if (!data.applicant_last_name.trim()) required('applicant_last_name')
  })

type AdoptionCreateData = z.infer<typeof adoptionCreateSchema>

interface AdoptionCreatePageProps {
  persons: PersonListResource[]
  mediators: PersonListResource[]
  onCreated: (id: string) => void
  onClose: () => void
  breadcrumb?: ReactNode
}

export function AdoptionCreatePage({
  persons,
  mediators,
  onCreated,
  onClose,
  breadcrumb,
}: AdoptionCreatePageProps) {
  const queryClient = useQueryClient()

  const form = useForm<AdoptionCreateData>({
    resolver: zodResolver(adoptionCreateSchema),
    defaultValues: {
      animal_id: '',
      mediator_id: null,
      applicant_source: 'new',
      applicant_person_id: '',
      applicant_first_name: '',
      applicant_last_name: '',
      applicant_email: '',
      applicant_phone: '',
    },
  })
  const source = useWatch({ control: form.control, name: 'applicant_source' })

  const createMutation = useMutation({
    mutationFn: createAdoption,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.list() })
      toast.success(response.message || 'Vermittlung erfolgreich erstellt')
      onCreated(response.data.id)
    },
    onError: (error) => {
      if (error instanceof ApiValidationError && error.errors) {
        for (const [key, messages] of Object.entries(error.errors)) {
          form.setError(key as keyof AdoptionCreateData, {
            message: messages[0],
          })
        }
        return
      }
      toast.error('Fehler beim Erstellen der Vermittlung')
    },
  })

  const handleSubmit = (data: AdoptionCreateData) => {
    createMutation.mutate(toCreateRequest(data))
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
          <DialogTitle>Neue Vermittlung</DialogTitle>
          <DialogDescription>
            Erstelle einen neuen Vermittlungsvorgang für ein Tier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <AnimalSelect
            name="animal_id"
            control={form.control}
            label="Tier"
            required
          />
          <FieldGroup className="gap-3">
            <FieldLabel>Interessent:in</FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              aria-label="Interessent:in"
              value={source}
              onValueChange={(value) => {
                // A single toggle group reports '' when the active item is clicked again.
                if (value)
                  form.setValue(
                    'applicant_source',
                    value as AdoptionCreateData['applicant_source']
                  )
              }}
            >
              <ToggleGroupItem value="new">Neue Angaben</ToggleGroupItem>
              <ToggleGroupItem value="person">Bekannte Person</ToggleGroupItem>
            </ToggleGroup>
            {source === 'person' ? (
              <PersonSelect
                name="applicant_person_id"
                control={form.control}
                label="Person"
                description="Name, Kontakt und Anschrift werden einmalig in die Vermittlung übernommen; die Person bleibt verknüpft."
                persons={persons}
                required
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    name="applicant_first_name"
                    control={form.control}
                    label="Vorname"
                    required
                  />
                  <TextInput
                    name="applicant_last_name"
                    control={form.control}
                    label="Nachname"
                    required
                  />
                </div>
                <TextInput
                  name="applicant_email"
                  control={form.control}
                  label="E-Mail"
                  type="email"
                  description="Verknüpft die Vermittlung mit früheren Vermittlungen derselben Person."
                />
                <TextInput
                  name="applicant_phone"
                  control={form.control}
                  label="Telefon"
                />
              </>
            )}
          </FieldGroup>
          <PersonSelect
            name="mediator_id"
            control={form.control}
            label="Vermittler"
            persons={mediators}
            renderSubline={(person) =>
              person.mediator_animal_types
                ? `Vermittlung für ${person.mediator_animal_types.map((animalType) => animalType.title).join(', ')}`
                : ''
            }
            canRemove
          />
          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
          <DialogBreadcrumb>{breadcrumb}</DialogBreadcrumb>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function toCreateRequest(data: AdoptionCreateData): CreateAdoptionRequest {
  const base = { animal_id: data.animal_id, mediator_id: data.mediator_id }
  if (data.applicant_source === 'person') {
    return { ...base, applicant_person_id: data.applicant_person_id }
  }
  return {
    ...base,
    applicant_first_name: data.applicant_first_name.trim(),
    applicant_last_name: data.applicant_last_name.trim(),
    applicant_email: data.applicant_email.trim(),
    applicant_phone: data.applicant_phone.trim(),
  }
}
