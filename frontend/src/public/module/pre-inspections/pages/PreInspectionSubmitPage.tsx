import { useState } from 'react'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog'
import { CheckCircle, ClipboardCheck } from 'lucide-react'
import { getPublicInspectionQuery } from '@/public/module/pre-inspections/api/queries'
import { submitPublicInspection } from '@/public/module/pre-inspections/api/requests'
import { InfoRow, InfoRowValue } from '@/shadcn/components/common/info-row.tsx'
import { Field, FieldGroup, FieldLabel } from '@/shadcn/components/ui/field.tsx'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { Textarea } from '@/components/field/Textarea.tsx'

const submitSchema = z.object({
  verdict: z.enum(['approved', 'rejected'], {
    error: 'Bitte wähle ein Ergebnis aus',
  }),
  notes: z.string().optional().or(z.literal('')),
})

type SubmitFormData = z.infer<typeof submitSchema>

interface PreInspectionSubmitPageProps {
  token: string
}

export function PreInspectionSubmitPage({
  token,
}: PreInspectionSubmitPageProps) {
  const { data: inspection } = useSuspenseQuery(getPublicInspectionQuery(token))

  const [confirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<SubmitFormData>({
    resolver: zodResolver(submitSchema),
    defaultValues: { verdict: undefined, notes: '' },
  })

  const submitMutation = useMutation({
    mutationFn: submitPublicInspection.bind(null, token),
    onError: () => setConfirmOpen(false),
  })

  if (submitMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle variant="success">
              <CardTitleIcon icon={CheckCircle} />
              Vorkontrolle eingereicht
            </CardTitle>
            <CardDescription>
              Vielen Dank! Deine Einschätzung wurde erfolgreich übermittelt.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
        className="min-h-screen bg-background py-8 px-4"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <CardTitleIcon icon={ClipboardCheck} />
                Vorkontrolle
              </CardTitle>
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einreichung bestätigen</DialogTitle>
            <DialogDescription>
              Möchtest du die Vorkontrolle wirklich einreichen? Diese Aktion
              kann nicht rückgängig gemacht werden. Der Link wird danach
              ungültig.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => submitMutation.mutate(form.getValues())}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending
                ? 'Wird eingereicht...'
                : 'Ja, einreichen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
