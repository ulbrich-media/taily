import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { FieldGroup, FieldSeparator } from '@/shadcn/components/ui/field.tsx'
import type { PersonListResource } from '@/api/types/people'
import type { AnimalDetailResource } from '@/api/types/animals'
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'
import { FormBlocker } from '@/components/form/FormBlocker'
import { CurrencyInput } from '@/components/field/CurrencyInput.tsx'
import { PersonSelect } from '@/components/field/PersonSelect.tsx'
import { TextInput } from '@/components/field/TextInput.tsx'
import { SingleCheckbox } from '@/components/field/SingleCheckbox.tsx'

const nullableDecimal = z
  .string()
  .regex(/^\d*\.?\d*$/, 'Bitte gib eine gültige Zahl ein')
  .nullable()
  .optional()

const animalFormPlacementSchema = z.object({
  assigned_agent_id: z.string().nullable().optional(),
  origin_organization: z
    .string()
    .max(255, 'Organisation darf maximal 255 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  owner_id: z.string().nullable().optional(),
  adoption_fee: nullableDecimal,
  is_boarding_animal: z.boolean(),
  monthly_boarding_cost: nullableDecimal,
  sponsor_id: z.string().nullable().optional(),
  sponsor_external: z
    .string()
    .max(255, 'Patenname darf maximal 255 Zeichen lang sein')
    .optional()
    .or(z.literal('')),
  monthly_sponsorship: nullableDecimal,
})

export type AnimalFormPlacementData = z.infer<typeof animalFormPlacementSchema>

interface AnimalFormPlacementProps {
  persons: PersonListResource[]
  mediators: PersonListResource[]
  defaultValues?: Partial<AnimalDetailResource>
  onSubmit: (data: AnimalFormPlacementData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function AnimalFormPlacement({
  persons,
  mediators,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Speichern',
}: AnimalFormPlacementProps) {
  const form = useForm<AnimalFormPlacementData>({
    resolver: zodResolver(animalFormPlacementSchema),
    defaultValues: {
      assigned_agent_id: defaultValues?.assigned_agent_id ?? null,
      origin_organization: defaultValues?.origin_organization || '',
      owner_id: defaultValues?.owner_id ?? null,
      adoption_fee: defaultValues?.adoption_fee ?? null,
      is_boarding_animal: defaultValues?.is_boarding_animal || false,
      monthly_boarding_cost: defaultValues?.monthly_boarding_cost ?? null,
      sponsor_id: defaultValues?.sponsor_id ?? null,
      sponsor_external: defaultValues?.sponsor_external || '',
      monthly_sponsorship: defaultValues?.monthly_sponsorship ?? null,
    },
  })

  const handleFormSubmit = async (data: AnimalFormPlacementData) => {
    await onSubmit(data)
    form.reset(data)
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        <FormBlocker />

        <FieldGroup>
          <FormSection
            title="Vermittlung"
            description="Verknüpfungen zu Personen, die für die Vermittlung relevant sind."
          >
            <FormGrid>
              <PersonSelect
                name="assigned_agent_id"
                control={form.control}
                label="Zuständiges Mitglied"
                info="Die Person, die für dieses Tier zuständig ist"
                persons={mediators}
                renderSubline={(person) =>
                  person.mediator_animal_types
                    ? `Vermittlung für ${person.mediator_animal_types.map((animalType) => animalType.title).join(', ')}`
                    : ''
                }
                canRemove
              />

              <TextInput
                name="origin_organization"
                control={form.control}
                label="Abgebender Verein"
              />

              <PersonSelect
                name="owner_id"
                control={form.control}
                label="Halter"
                info="Diese Person ist derzeit im Besitz des Tieres."
                persons={persons}
                canRemove
              />

              <CurrencyInput
                name="adoption_fee"
                control={form.control}
                label="Schutzgebühr"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Pension" titleHidden>
            <FormGrid>
              <SingleCheckbox
                name="is_boarding_animal"
                control={form.control}
                label="Pensionsstatus"
                checkboxLabel="Ist pensioniert"
              />

              <CurrencyInput
                name="monthly_boarding_cost"
                control={form.control}
                label="Monatliche Pensionskosten"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Patenschaft" titleHidden>
            <FormGrid>
              <PersonSelect
                name="sponsor_id"
                control={form.control}
                label="Pate"
                persons={persons}
                canRemove
              />

              <TextInput
                name="sponsor_external"
                control={form.control}
                label="Pate (extern/Alternative)"
                info="Alternative: Name eines externen Paten (falls nicht in der Personenliste)"
              />

              <CurrencyInput
                name="monthly_sponsorship"
                control={form.control}
                label="Monatliche Patenschaft"
              />
            </FormGrid>
          </FormSection>
        </FieldGroup>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Speichert...' : submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
