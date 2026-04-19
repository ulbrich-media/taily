import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { Input } from '@/shadcn/components/ui/input.tsx'
import { FieldGroup, FieldSeparator } from '@/shadcn/components/ui/field.tsx'
import type { PersonDetailResource } from '@/api/types/people'
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
import { OrganizationSelect } from '@/components/field/OrganizationSelect'
import { listOrganizationsQuery } from '@/admin/module/organizations/api/queries'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const personFormBasicSchema = z.object({
  first_name: zFieldString({ required: true }),
  last_name: zFieldString({ required: true }),
  date_of_birth: zFieldDate,
  organization_id: z.string(),
  organization_role: zFieldString(),
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein')
    .trim()
    .or(z.literal('')),
  phone: zFieldString(),
  mobile: zFieldString(),
  street_line: zFieldString(),
  street_line_additional: zFieldString(),
  postal_code: zFieldString({ maxLength: 20 }),
  city: zFieldString(),
  country_code: z
    .string()
    .length(2, 'Ländercode muss 2 Zeichen lang sein')
    .trim()
    .or(z.literal('')),
})

export type PersonFormBasicData = z.infer<typeof personFormBasicSchema>

interface PersonFormBasicProps {
  defaultValues?: Partial<PersonDetailResource>
  onSubmit: (data: PersonFormBasicData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  showSecondaryButton?: boolean
  onSecondarySubmit?: () => void
  secondaryButtonLabel?: string
}

export function PersonFormBasic({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showSecondaryButton = false,
  onSecondarySubmit,
}: PersonFormBasicProps) {
  const { data: organizations } = useSuspenseQuery(listOrganizationsQuery)

  const form = useForm<PersonFormBasicData>({
    resolver: zodResolver(personFormBasicSchema),
    defaultValues: {
      first_name: defaultValues?.first_name ?? '',
      last_name: defaultValues?.last_name ?? '',
      date_of_birth: toDateFieldValue(defaultValues?.date_of_birth),
      organization_id: defaultValues?.organization_id ?? '',
      organization_role: defaultValues?.organization_role || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      mobile: defaultValues?.mobile || '',
      street_line: defaultValues?.street_line || '',
      street_line_additional: defaultValues?.street_line_additional || '',
      postal_code: defaultValues?.postal_code || '',
      city: defaultValues?.city || '',
      country_code: defaultValues?.country_code || '',
    },
  })

  const handleFormSubmit = async (data: PersonFormBasicData) => {
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
            title="Persönliche Informationen"
            description="Grundlegende Angaben zur Person."
          >
            <FormGrid>
              <TextInput
                name="first_name"
                control={form.control}
                label="Vorname"
                required
              />

              <TextInput
                name="last_name"
                control={form.control}
                label="Nachname"
                required
              />

              <DateInput
                name="date_of_birth"
                control={form.control}
                label="Geburtsdatum"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Organisation" titleHidden>
            <FormGrid>
              <OrganizationSelect
                name="organization_id"
                control={form.control}
                label="Organisation"
                organizations={organizations}
                canRemove
              />

              <TextInput
                name="organization_role"
                control={form.control}
                label="Rolle in Organisation"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Kontaktdaten" titleHidden>
            <FormGrid>
              <FormFieldWrapper
                name="email"
                control={form.control}
                label="E-Mail"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                )}
              />

              <FormFieldWrapper
                name="phone"
                control={form.control}
                label="Telefon"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                )}
              />

              <FormFieldWrapper
                name="mobile"
                control={form.control}
                label="Mobil"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                )}
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection title="Adresse" titleHidden>
            <FormGrid>
              <TextInput
                name="street_line"
                control={form.control}
                label="Straße und Hausnummer"
              />

              <TextInput
                name="street_line_additional"
                control={form.control}
                label="Adresszusatz"
                info="z.B. Etage, Apartment-Nr., c/o"
              />

              <TextInput
                name="postal_code"
                control={form.control}
                label="Postleitzahl"
              />

              <TextInput name="city" control={form.control} label="Stadt" />

              <FormFieldWrapper
                name="country_code"
                control={form.control}
                label="Ländercode"
                info="2-Buchstaben ISO-Code (z.B. DE, AT, CH)"
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    placeholder="DE"
                    maxLength={2}
                  />
                )}
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
