import { useState } from 'react'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/shadcn/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/shadcn/components/ui/alert-dialog'
import { CheckCircle, ClipboardCheck } from 'lucide-react'
import { getPublicInspectionQuery } from '@/public/module/pre-inspections/api/queries'
import { submitPublicInspection } from '@/public/module/pre-inspections/api/requests'
import { InfoRow, InfoRowValue } from '@/shadcn/components/common/info-row.tsx'
import { Field, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field.tsx'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { Textarea } from '@/components/field/Textarea.tsx'
import { DynamicFormFields } from '@/components/form/DynamicFormFields'
import { useDynamicFormSchema } from '@/components/form/useDynamicFormSchema'
import type { JsonSchemaShape } from '@/components/form/jsonSchemaToZod'
import { FormBlocker } from '@/components/form/FormBlocker.tsx'

const staticSchema = z.object({
  verdict: z.enum(['approved', 'rejected'], {
    error: 'Bitte wähle ein Ergebnis aus',
  }),
  notes: z.string(),
})

type SubmitFormData = z.infer<typeof staticSchema> & {
  form_data: Record<string, unknown>
}

interface PreInspectionSubmitPageProps {
  token: string
}

export function PreInspectionSubmitPage({
  token,
}: PreInspectionSubmitPageProps) {
  const { data: inspection } = useSuspenseQuery(getPublicInspectionQuery(token))

  const [confirmOpen, setConfirmOpen] = useState(false)

  const schema = useDynamicFormSchema(
    staticSchema,
    inspection.pre_inspection_form_template?.schema as JsonSchemaShape
  )

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(schema) as never,
    defaultValues: { verdict: undefined, notes: '', form_data: {} },
  })

  const submitMutation = useMutation({
    mutationFn: (data: SubmitFormData) =>
      submitPublicInspection(token, {
        verdict: data.verdict!,
        notes: data.notes || null,
        form_data: inspection.pre_inspection_form_template
          ? data.form_data
          : undefined,
        form_template_version_id:
          inspection.pre_inspection_form_template?.version_id ?? null,
      }),
    onError: () => setConfirmOpen(false),
  })

  if (submitMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle variant="success">Vorkontrolle eingereicht</CardTitle>
            <CardTitleIcon icon={CheckCircle} />
            <CardDescription>
              Vielen Dank! Deine Einschätzung wurde erfolgreich übermittelt.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
        className="min-h-screen py-8 px-4"
      >
        <FormBlocker />

        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vorkontrolle</CardTitle>
              <CardTitleIcon icon={ClipboardCheck} />
              <CardDescription>
                Bitte fülle das folgende Formular aus und reiche es ein.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-muted/50">
                <div>
                  <InfoRow label="Interessent">
                    <InfoRowValue>{inspection.person.full_name}</InfoRowValue>
                    {inspection.person.street_line &&
                      inspection.person.postal_code &&
                      inspection.person.city &&
                      inspection.person.country_code && (
                        <div className="text-sm text-muted-foreground">
                          {inspection.person.street_line}
                          <br />
                          {inspection.person.postal_code}{' '}
                          {inspection.person.city}{' '}
                          {inspection.person.country_code}
                        </div>
                      )}
                  </InfoRow>
                </div>
                <div>
                  <InfoRow label="Kontrolle für">
                    {inspection.animal_type.title}
                  </InfoRow>
                </div>
              </div>
            </CardContent>
          </Card>

          {inspection.pre_inspection_form_template && (
            <Card>
              <CardHeader>
                <CardTitle>Kontrolldaten</CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicFormFields
                  schema={
                    inspection.pre_inspection_form_template
                      .schema as Parameters<
                      typeof DynamicFormFields
                    >[0]['schema']
                  }
                  uiSchema={
                    inspection.pre_inspection_form_template
                      .ui_schema as Parameters<
                      typeof DynamicFormFields
                    >[0]['uiSchema']
                  }
                  control={
                    form.control as unknown as Parameters<
                      typeof DynamicFormFields
                    >[0]['control']
                  }
                  namePrefix="form_data"
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Bewertung</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <FormFieldWrapper
                  name="verdict"
                  control={form.control}
                  label="Ergebnis"
                  required
                  render={({ field }) => (
                    <RadioGroup {...field}>
                      <Field orientation="horizontal">
                        <RadioGroupItem
                          value="approved"
                          id="verdict-approved"
                        />
                        <FieldLabel htmlFor="verdict-approved">
                          Angenommen – Die Person ist geeignet
                        </FieldLabel>
                      </Field>
                      <Field orientation="horizontal">
                        <RadioGroupItem
                          value="rejected"
                          id="verdict-rejected"
                        />
                        <FieldLabel htmlFor="verdict-rejected">
                          Abgelehnt – Die Person ist nicht geeignet
                        </FieldLabel>
                      </Field>
                    </RadioGroup>
                  )}
                />

                <Textarea
                  name="notes"
                  control={form.control}
                  label="Notizen"
                  rows={6}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col items-end gap-3">
              {submitMutation.error && (
                <p className="text-sm text-destructive self-start">
                  {submitMutation.error.message}
                </p>
              )}
              <Button type="submit" disabled={submitMutation.isPending}>
                Einreichen
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ClipboardCheck />
            </AlertDialogMedia>
            <AlertDialogTitle>Einreichung bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Vorkontrolle wirklich einreichen? Diese Aktion
              kann nicht rückgängig gemacht werden. Der Link wird danach
              ungültig.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              disabled={submitMutation.isPending}
            >
              Abbrechen
            </AlertDialogCancel>
            <Button
              onClick={() => submitMutation.mutate(form.getValues())}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending
                ? 'Wird eingereicht...'
                : 'Ja, einreichen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}
