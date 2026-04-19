import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/shadcn/components/ui/field.tsx'
import type { AnimalDetailResource } from '@/api/types/animals'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/shadcn/components/ui/radio-group.tsx'
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput.tsx'
import { DateInput } from '@/components/field/DateInput.tsx'
import {
  zFieldDate,
  toDateFieldValue,
} from '@/components/field/DateInput.utils.ts'
import { Textarea } from '@/components/field/Textarea.tsx'
import { SelectInput } from '@/components/field/SelectInput.tsx'
import type { AnimalTypeResource } from '@/api/types/animal-types'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'

const animalFormBasicSchema = z.object({
  animal_type_id: z.string().min(1, 'Pflichtfeld darf nicht leer sein'),
  animal_number: zFieldString(),
  name: zFieldString({ required: true }),
  old_name: zFieldString(),
  breed: zFieldString(),
  gender: z.enum(['male', 'female'], {
    error: 'Geschlecht muss gewählt werden',
  }),
  color: zFieldString(),
  date_of_birth: zFieldDate,
  origin_country: zFieldString(),
  intake_date: zFieldDate,
  character_description: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
  contract_notes: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
  internal_notes: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
})

export type AnimalFormBasicData = z.infer<typeof animalFormBasicSchema>

interface AnimalFormBasicProps {
  animalTypes: AnimalTypeResource[]
  defaultValues?: Partial<AnimalDetailResource>
  onSubmit: (data: AnimalFormBasicData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  showSecondaryButton?: boolean
  onSecondarySubmit?: () => void
  secondaryButtonLabel?: string
}

export function AnimalFormBasic({
  animalTypes = [],
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showSecondaryButton = false,
  onSecondarySubmit,
}: AnimalFormBasicProps) {
  const isEditMode = !!defaultValues?.animal_type

  // Preset animal_type_id if only one option and no default value
  const presetAnimalTypeId =
    !defaultValues?.animal_type_id && animalTypes.length === 1
      ? animalTypes[0].id
      : defaultValues?.animal_type_id

  const form = useForm<AnimalFormBasicData>({
    resolver: zodResolver(animalFormBasicSchema),
    defaultValues: {
      animal_type_id: presetAnimalTypeId,
      animal_number: defaultValues?.animal_number ?? '',
      name: defaultValues?.name ?? '',
      old_name: defaultValues?.old_name || '',
      breed: defaultValues?.breed || '',
      gender: defaultValues?.gender,
      color: defaultValues?.color || '',
      date_of_birth: toDateFieldValue(defaultValues?.date_of_birth),
      origin_country: defaultValues?.origin_country || '',
      intake_date: toDateFieldValue(defaultValues?.intake_date),
      character_description: defaultValues?.character_description || '',
      contract_notes: defaultValues?.contract_notes || '',
      internal_notes: defaultValues?.internal_notes || '',
    },
  })

  const handleFormSubmit = async (data: AnimalFormBasicData) => {
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
            title="Allgemeine Angaben"
            description="Die wichtigsten Informationen."
          >
            <FormGrid>
              <SelectInput
                name="animal_type_id"
                control={form.control}
                disabled={isEditMode}
                label="Tierart"
                required
                options={animalTypes.map((type) => ({
                  value: type.id,
                  label: type.title,
                }))}
                placeholder="Tierart auswählen"
              />

              <TextInput
                name="animal_number"
                control={form.control}
                label="Tiernummer"
              />

              <TextInput
                name="name"
                control={form.control}
                label="Name"
                required
              />

              <TextInput
                name="old_name"
                control={form.control}
                label="Alter Name"
                info="Unter diesem Namen war das Tier früher bekannt."
              />

              <FormFieldWrapper
                name="gender"
                control={form.control}
                label="Geschlecht"
                required
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    name={field.name}
                    onBlur={field.onBlur}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value="male" id="gender-male" />
                      <FieldLabel htmlFor="gender-male">Männlich</FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value="female" id="gender-female" />
                      <FieldLabel htmlFor="gender-female">Weiblich</FieldLabel>
                    </Field>
                  </RadioGroup>
                )}
              />

              <DateInput
                name="date_of_birth"
                control={form.control}
                label="Geburtsdatum"
              />

              <TextInput name="breed" control={form.control} label="Rasse" />

              <TextInput name="color" control={form.control} label="Farbe" />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Herkunft">
            <FormGrid>
              <TextInput
                name="origin_country"
                control={form.control}
                label="Herkunftsland"
              />

              <DateInput
                name="intake_date"
                control={form.control}
                label="Aufnahmedatum"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Beschreibungen">
            <FormGrid columns={1}>
              <Textarea
                name="character_description"
                control={form.control}
                label="Identifizierende Merkmale"
                description="Tasso Pflichtfeld"
                info="Charaktereigenschaften und besondere Merkmale, die bei der Identifizierung des Tieres helfen können. "
              />

              <Textarea
                name="contract_notes"
                control={form.control}
                label="Vertragsrelevante Informationen"
              />

              <Textarea
                name="internal_notes"
                control={form.control}
                label="Interne Notizen"
                info="Diese Notizen sind nur zur internen Verwendung und werden nie nach außen gegeben."
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
          {showSecondaryButton && onSecondarySubmit && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                form.handleSubmit(handleFormSubmit)()
                onSecondarySubmit()
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Speichert...' : 'Speichern und Neu'}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Speichert...' : 'Speichern'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
