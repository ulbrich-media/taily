import { useState } from 'react'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  useForm,
  Controller,
  FormProvider,
  type Control,
  type FieldPath,
} from 'react-hook-form'
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
import { Checkbox } from '@/shadcn/components/ui/checkbox'
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
import { CheckCircle, FileSignature } from 'lucide-react'
import { getPublicContractQuery } from '@/public/module/contracts/api/queries'
import {
  contractDocumentUrl,
  submitPublicContractSignature,
} from '@/public/module/contracts/api/requests'
import { InfoRow, InfoRowValue } from '@/shadcn/components/common/info-row.tsx'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { TextInput } from '@/components/field/TextInput'
import { FormBlocker } from '@/components/form/FormBlocker.tsx'

const REQUIRED_CONSENT_MSG = 'Diese Bestätigung ist erforderlich'

const schema = z.object({
  typed_name: z.string().min(1, 'Bitte gib deinen vollständigen Namen ein'),
  contract_content_accepted: z
    .boolean()
    .refine((v) => v === true, REQUIRED_CONSENT_MSG),
  privacy_policy_accepted: z
    .boolean()
    .refine((v) => v === true, REQUIRED_CONSENT_MSG),
  information_confirmed: z
    .boolean()
    .refine((v) => v === true, REQUIRED_CONSENT_MSG),
})

type SignFormData = z.infer<typeof schema>

interface ConsentCheckboxProps {
  name: FieldPath<SignFormData>
  control: Control<SignFormData>
  label: string
}

function ConsentCheckbox({ name, control, label }: ConsentCheckboxProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Field orientation="horizontal">
            <Checkbox
              id={field.name}
              checked={field.value as boolean}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          </Field>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}

interface ContractSignPageProps {
  token: string
}

export function ContractSignPage({ token }: ContractSignPageProps) {
  const queryClient = useQueryClient()
  const { data: contract } = useSuspenseQuery(getPublicContractQuery(token))

  const [confirmOpen, setConfirmOpen] = useState(false)

  const form = useForm<SignFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      typed_name: '',
      contract_content_accepted: false,
      privacy_policy_accepted: false,
      information_confirmed: false,
    },
  })

  const submitMutation = useMutation({
    mutationFn: (data: SignFormData) =>
      submitPublicContractSignature(token, data),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: getPublicContractQuery(token).queryKey,
      }),
    onError: () => setConfirmOpen(false),
  })

  if (submitMutation.isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle variant="success">Unterschrift übermittelt</CardTitle>
            <CardTitleIcon icon={CheckCircle} />
            <CardDescription>
              Vielen Dank! Deine Unterschrift wurde erfolgreich übermittelt.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const roleLabel =
    contract.role === 'mediator' ? 'Vermittler:in' : 'Adoptant:in'

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
        className="min-h-screen py-8 px-4"
      >
        <FormBlocker />

        <div className="mx-auto max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schutzvertrag unterschreiben</CardTitle>
              <CardTitleIcon icon={FileSignature} />
              <CardDescription>
                Bitte prüfe den Vertrag unten und unterschreibe ihn als{' '}
                {roleLabel}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-muted/50">
                <div>
                  <InfoRow label="Tier">
                    <InfoRowValue>{contract.animal.name}</InfoRowValue>
                    {contract.animal.animal_type && (
                      <div className="text-sm text-muted-foreground">
                        {contract.animal.animal_type}
                      </div>
                    )}
                  </InfoRow>
                </div>
                <div>
                  <InfoRow label="Du unterschreibst als">{roleLabel}</InfoRow>
                </div>
              </div>

              {contract.other_signer && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {contract.other_signer.role === 'mediator'
                    ? 'Der/die Vermittler:in'
                    : 'Der/die Adoptant:in'}{' '}
                  hat bereits unterschrieben: {contract.other_signer.typed_name}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vertragsdokument</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                src={contractDocumentUrl(token)}
                title="Schutzvertrag"
                className="w-full h-[70vh] rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unterschrift</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <TextInput
                  name="typed_name"
                  control={form.control}
                  label="Vollständiger Name"
                  required
                />

                <ConsentCheckbox
                  name="contract_content_accepted"
                  control={form.control}
                  label="Ich akzeptiere den Inhalt dieses Vertrags."
                />

                <ConsentCheckbox
                  name="privacy_policy_accepted"
                  control={form.control}
                  label="Ich akzeptiere die Datenschutzerklärung."
                />

                <ConsentCheckbox
                  name="information_confirmed"
                  control={form.control}
                  label="Ich bestätige, dass meine Angaben korrekt sind."
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
                Unterschreiben
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <FileSignature />
            </AlertDialogMedia>
            <AlertDialogTitle>Unterschrift bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du den Schutzvertrag wirklich unterschreiben? Diese
              Aktion kann nicht rückgängig gemacht werden.
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
                ? 'Wird übermittelt...'
                : 'Ja, unterschreiben'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  )
}
