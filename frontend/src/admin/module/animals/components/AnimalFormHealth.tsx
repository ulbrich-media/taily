import { Controller, useForm, useWatch, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/shadcn/components/ui/button.tsx'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/shadcn/components/ui/field.tsx'
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group'
import type { AnimalDetailResource } from '@/api/types/animals'
import type { VaccinationResource } from '@/api/types/vaccinations'
import type { MedicalTestResource } from '@/api/types/medical-tests'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shadcn/components/ui/table.tsx'
import { FormSection } from '@/components/form/FormSection'
import { FormGrid } from '@/components/form/FormGrid'
import { FormBlocker } from '@/components/form/FormBlocker'
import { SingleCheckbox } from '@/components/field/SingleCheckbox.tsx'
import { Textarea } from '@/components/field/Textarea.tsx'
import { TextInput } from '@/components/field/TextInput.tsx'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert.tsx'
import { InfoIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  STRING_LENGTH_TEXTAREA,
  zFieldString,
} from '@/components/field/TextInput.utils.ts'
import { DatePickerControl } from '@/components/field/DateInput.tsx'
import {
  toDateFieldValue,
  zFieldDate,
} from '@/components/field/DateInput.utils.ts'

const vaccinationSchema = z.object({
  vaccination_id: z.string().min(1, 'Impfung ist erforderlich'),
  vaccinated_at: zFieldDate,
  result: z.enum(['done', 'unset'], {
    error: 'Ergebnis ist erforderlich',
  }),
  _title: z.string(),
})

const testSchema = z.object({
  medical_test_id: z.string().min(1, 'Test ist erforderlich'),
  tested_at: zFieldDate,
  result: z.enum(['positive', 'negative', 'unset'], {
    error: 'Ergebnis ist erforderlich',
  }),
  _title: z.string(),
})

const animalFormHealthSchema = z.object({
  is_neutered: z.boolean(),
  health_description: zFieldString({ maxLength: STRING_LENGTH_TEXTAREA }),
  tasso_id: zFieldString(),
  findefix_id: zFieldString(),
  trace_id: zFieldString(),
  vaccinations: z.array(vaccinationSchema),
  tests: z.array(testSchema),
})

export type AnimalFormHealthData = z.infer<typeof animalFormHealthSchema>

interface AnimalFormHealthProps {
  defaultValues?: Partial<AnimalDetailResource>
  vaccinations: VaccinationResource[]
  medicalTests: MedicalTestResource[]
  onSubmit: (data: AnimalFormHealthData) => Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
  submitLabel?: string
  vaccinationsLink?: ReactNode
  medicalTestsLink?: ReactNode
}

export function AnimalFormHealth({
  defaultValues,
  vaccinations,
  medicalTests,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Speichern',
  vaccinationsLink,
  medicalTestsLink,
}: AnimalFormHealthProps) {
  const form = useForm<AnimalFormHealthData>({
    resolver: zodResolver(animalFormHealthSchema),
    defaultValues: {
      is_neutered: defaultValues?.is_neutered || false,
      health_description: defaultValues?.health_description || '',
      tasso_id: defaultValues?.tasso_id || '',
      findefix_id: defaultValues?.findefix_id || '',
      trace_id: defaultValues?.trace_id || '',
      vaccinations: vaccinations.map((vaccination) => {
        const existing = defaultValues?.vaccinations?.find(
          (v) => v.id === vaccination.id
        )

        return {
          vaccination_id: vaccination.id,
          vaccinated_at: toDateFieldValue(existing?.pivot.vaccinated_at),
          result: existing ? 'done' : 'unset',
          _title: vaccination.title,
        }
      }),
      tests: medicalTests.map((medicalTest) => {
        const existing = defaultValues?.medical_tests?.find(
          (t) => t.id === medicalTest.id
        )

        return {
          medical_test_id: medicalTest.id,
          tested_at: toDateFieldValue(existing?.pivot.tested_at),
          result: existing?.pivot.result ?? 'unset',
          _title: medicalTest.title,
        }
      }),
    },
  })

  const vaccinationFields = useWatch({
    control: form.control,
    name: 'vaccinations',
  })

  const testFields = useWatch({
    control: form.control,
    name: 'tests',
  })

  const handleFormSubmit = async (data: AnimalFormHealthData) => {
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
            title="Medizinische Informationen"
            description="Gesundheitliche und medizinische Daten."
          >
            <FormGrid>
              <SingleCheckbox
                name="is_neutered"
                control={form.control}
                label="Kastration"
                checkboxLabel="Ist kastriert"
              />
            </FormGrid>

            <FormGrid columns={1}>
              <Textarea
                name="health_description"
                control={form.control}
                label="Weitere Gesundheitsinformationen"
                info="Zusätzliche Informationen zu Tests, Impfungen und Gesundheitszustand"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Registrierungen"
            description="Dienste und Stellen bei denen das Tier gemeldet ist."
          >
            <FormGrid>
              <TextInput
                name="tasso_id"
                control={form.control}
                label="TASSO-Nummer"
                info="Registrierungsnummer bei TASSO e.V."
              />

              <TextInput
                name="findefix_id"
                control={form.control}
                label="FINDEFIX-Nummer"
                info="Registrierungsnummer bei FINDEFIX (Deutscher Tierschutzbund)"
              />

              <TextInput
                name="trace_id"
                control={form.control}
                label="Traces"
                info="Traces-Nummer für den Transport innerhalb der EU"
              />
            </FormGrid>
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Impfungen"
            description="Verwaltung der Impfungen für dieses Tier"
          >
            {form.formState.errors.vaccinations?.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.vaccinations.root.message}
              </div>
            )}

            {vaccinationFields.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Impfung</TableHead>
                    <TableHead>Erhalten am</TableHead>
                    <TableHead className="th-contain"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vaccinationFields.map((vaccination, index) => (
                    <TableRow key={vaccination.vaccination_id}>
                      <TableCell className="font-medium">
                        {vaccination._title}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`vaccinations.${index}.vaccinated_at`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="sr-only">
                                Erhalten am
                              </FieldLabel>
                              <DatePickerControl
                                field={field}
                                fieldState={fieldState}
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`vaccinations.${index}.result`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              className="flex-1"
                            >
                              <FieldLabel className="sr-only">
                                Ergebnis
                              </FieldLabel>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="done"
                                    id={`vaccinations-${index}-done`}
                                  />
                                  <FieldLabel
                                    htmlFor={`vaccinations-${index}-done`}
                                    className="font-normal"
                                  >
                                    Erhalten
                                  </FieldLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="unset"
                                    id={`vaccinations-${index}-unset`}
                                  />
                                  <FieldLabel
                                    htmlFor={`vaccinations-${index}-unset`}
                                    className="font-normal"
                                  >
                                    Nicht erhalten
                                  </FieldLabel>
                                </div>
                              </RadioGroup>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert className="xl:max-w-1/2">
                <InfoIcon />
                <AlertTitle>Keine Impfungen verfügbar!</AlertTitle>
                <AlertDescription>
                  Für diese Tierart konnten keine Impfungen gefunden werden.
                  Bitte lege welche an, wenn du für dieses Tier Impfungen
                  hinterlegen willst.
                  {vaccinationsLink && (
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="mt-2"
                    >
                      {vaccinationsLink}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </FormSection>

          <FieldSeparator />

          <FormSection
            title="Tests"
            description="Verwaltung der Tests für dieses Tier"
          >
            {form.formState.errors.tests?.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.tests.root.message}
              </div>
            )}

            {testFields.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Getestet am</TableHead>
                    <TableHead className="th-contain"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testFields.map((test, index) => (
                    <TableRow key={test.medical_test_id}>
                      <TableCell className="font-medium">
                        {test._title}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`tests.${index}.tested_at`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                              <FieldLabel className="sr-only">
                                Getestet am
                              </FieldLabel>
                              <DatePickerControl
                                field={field}
                                fieldState={fieldState}
                              />
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`tests.${index}.result`}
                          control={form.control}
                          render={({ field, fieldState }) => (
                            <Field
                              data-invalid={fieldState.invalid}
                              className="flex-1"
                            >
                              <FieldLabel className="sr-only">
                                Ergebnis
                              </FieldLabel>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="positive"
                                    id={`tests-${index}-positive`}
                                  />
                                  <FieldLabel
                                    htmlFor={`tests-${index}-positive`}
                                    className="font-normal"
                                  >
                                    Positiv
                                  </FieldLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="negative"
                                    id={`tests-${index}-negative`}
                                  />
                                  <FieldLabel
                                    htmlFor={`tests-${index}-negative`}
                                    className="font-normal"
                                  >
                                    Negativ
                                  </FieldLabel>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value="unset"
                                    id={`tests-${index}-unset`}
                                  />
                                  <FieldLabel
                                    htmlFor={`tests-${index}-unset`}
                                    className="font-normal"
                                  >
                                    Nicht getestet
                                  </FieldLabel>
                                </div>
                              </RadioGroup>
                              {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                              )}
                            </Field>
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert className="xl:max-w-1/2">
                <InfoIcon />
                <AlertTitle>Keine Tests verfügbar!</AlertTitle>
                <AlertDescription>
                  Für diese Tierart konnten keine Tests gefunden werden. Bitte
                  lege welche an, wenn du für dieses Tier Tests hinterlegen
                  willst.
                  {medicalTestsLink && (
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="mt-2"
                    >
                      {medicalTestsLink}
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
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
