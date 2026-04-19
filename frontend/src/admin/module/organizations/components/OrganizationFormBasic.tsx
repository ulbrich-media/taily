import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import type { OrganizationResource } from '@/api/types/organizations'
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'
import { FormBlocker } from '@/components/form/FormBlocker'
import { TextInput } from '@/components/field/TextInput'
import { zFieldString } from '@/components/field/TextInput.utils.ts'

const organizationFormBasicSchema = z.object({
  name: zFieldString({ required: true }),
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

export type OrganizationFormBasicData = z.infer<
  typeof organizationFormBasicSchema
>

interface OrganizationFormBasicProps {
  defaultValues?: Partial<OrganizationResource>
  onSubmit: (data: OrganizationFormBasicData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  showSecondaryButton?: boolean
  onSecondarySubmit?: () => void
}

export function OrganizationFormBasic({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  showSecondaryButton = false,
  onSecondarySubmit,
}: OrganizationFormBasicProps) {
  const form = useForm<OrganizationFormBasicData>({
    resolver: zodResolver(organizationFormBasicSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
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

  const handleFormSubmit = async (data: OrganizationFormBasicData) => {
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
            title="Allgemeine Informationen"
            description="Grundlegende Angaben zur Organisation."
          >
            <FormGrid>
              <TextInput
                name="name"
                control={form.control}
                label="Name"
                required
              />
            </FormGrid>
          </FormSection>

          <FormSection
            title="Kontaktinformationen"
            description="E-Mail und Telefonnummern."
          >
            <FormGrid>
              <TextInput name="email" control={form.control} label="E-Mail" />
              <TextInput name="phone" control={form.control} label="Telefon" />
              <TextInput name="mobile" control={form.control} label="Mobil" />
            </FormGrid>
          </FormSection>

          <FormSection
            title="Adresse"
            description="Standortinformationen der Organisation."
          >
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
              />
              <TextInput
                name="postal_code"
                control={form.control}
                label="Postleitzahl"
              />
              <TextInput name="city" control={form.control} label="Stadt" />
              <TextInput
                name="country_code"
                control={form.control}
                label="Ländercode"
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
              Speichern und Neu
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
