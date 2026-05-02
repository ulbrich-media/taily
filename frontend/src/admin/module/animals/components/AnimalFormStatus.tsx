import { Controller, useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/shadcn/components/ui/field.tsx'
import { Checkbox } from '@/shadcn/components/ui/checkbox.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput.tsx'
import { Textarea } from '@/components/field/Textarea.tsx'
import { SingleCheckbox } from '@/components/field/SingleCheckbox.tsx'
import { DateInput } from '@/components/field/DateInput.tsx'
import {
  zFieldDate,
  toDateFieldValue,
} from '@/components/field/DateInput.utils.ts'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'
import { TraitInput } from '@/components/field/TraitInput.tsx'

const animalFormStatusSchema = z.object({
  current_location: zFieldString(),
  alternate_transport_trace: zFieldString(),
  alternate_arrival_location: zFieldString(),
  do_publish: z.boolean(),
  publish_description: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
  compatibilities: z
    .array(z.string())
    .refine((arr) => new Set(arr).size === arr.length, {
      message: 'Einträge müssen eindeutig sein',
    }),
  personality_traits: z
    .array(z.string())
    .refine((arr) => new Set(arr).size === arr.length, {
      message: 'Einträge müssen eindeutig sein',
    }),
  application_url: z
    .string()
    .trim()
    .max(2048, 'Darf maximal 2048 Zeichen lang sein')
    .refine((val) => {
      if (!val) return true
      try {
        const u = new URL(val)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    }, 'Muss eine gültige URL sein (z.B. https://...)'),
  is_deceased: z.boolean(),
  date_of_death: zFieldDate,
})

export type AnimalFormStatusData = z.infer<typeof animalFormStatusSchema>

interface AnimalFormStatusProps {
  defaultValues?: Partial<AnimalDetailResource>
  animalTypeId: string
  onSubmit: (data: AnimalFormStatusData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function AnimalFormStatus({
  defaultValues,
  animalTypeId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Speichern',
}: AnimalFormStatusProps) {
  const form = useForm<AnimalFormStatusData>({
    resolver: zodResolver(animalFormStatusSchema),
    defaultValues: {
      current_location: defaultValues?.current_location || '',
      alternate_transport_trace: defaultValues?.alternate_transport_trace || '',
      alternate_arrival_location:
        defaultValues?.alternate_arrival_location || '',
      do_publish: defaultValues?.do_publish || false,
      publish_description: defaultValues?.publish_description || '',
      compatibilities: defaultValues?.compatibilities ?? [],
      personality_traits: defaultValues?.personality_traits ?? [],
      application_url: defaultValues?.application_url || '',
      is_deceased: defaultValues?.is_deceased || false,
      date_of_death: toDateFieldValue(defaultValues?.date_of_death),
    },
  })

  const handleFormSubmit = async (data: AnimalFormStatusData) => {
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
            title="Transport"
            description="Für den Transport relevante Informationen."
          >
            <FormGrid>
              <TextInput
                name="current_location"
                control={form.control}
                label="Aufenthaltsort"
                info="Aktueller Standort des Tieres"
              />

              <div></div>

              <TextInput
                name="alternate_transport_trace"
                control={form.control}
                label="Abweichende Traces"
                info="Alternative Transport-Traces-Nummer"
              />

              <TextInput
                name="alternate_arrival_location"
                control={form.control}
                label="Abweichender Ankunftsort"
                info="Falls das Tier an einem anderen Ort ankommt"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Veröffentlichung"
            description="Informationen zur Veröffentlichung und Bewerbung dieses Tieres."
          >
            <Controller
              name="do_publish"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id={field.name}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Soll gepostet werden
                    </FieldLabel>
                    <FieldDescription>
                      Soll dieses Tier auf der Website/in sozialen Medien
                      veröffentlicht werden?
                    </FieldDescription>
                  </FieldContent>
                </Field>
              )}
            />

            <FormGrid columns={1}>
              <Textarea
                name="publish_description"
                control={form.control}
                label="Beschreibungstext"
                description="Dieser Text wird als Tierbeschreibung auf der Website oder in sozialen Medien verwendet."
              />

              <TraitInput
                name="compatibilities"
                control={form.control}
                label="Verträglichkeiten"
                description="Mit wem oder was verträgt sich das Tier (z.B. Katzen, Kinder, andere Hunde)."
                animalTypeId={animalTypeId}
                traitField="compatibilities"
              />

              <TraitInput
                name="personality_traits"
                control={form.control}
                label="Persönlichkeit"
                description="Charaktereigenschaften des Tieres (z.B. verspielt, Jagdtrieb)."
                animalTypeId={animalTypeId}
                traitField="personality_traits"
              />

              <TextInput
                name="application_url"
                control={form.control}
                label="Bewerbungs-URL"
                description="Link zum Bewerbungsformular für die Adoption dieses Tieres. Muss eine vollständige URL sein (z.B. https://...)."
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Verstorben" titleHidden>
            <FormGrid columns={2}>
              <SingleCheckbox
                name="is_deceased"
                control={form.control}
                label="Verstorben"
                checkboxLabel="Ist verstorben"
              />
              <DateInput
                name="date_of_death"
                control={form.control}
                label="Todesdatum"
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
