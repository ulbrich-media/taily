import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Input } from '@/shadcn/components/ui/input'
import { Button } from '@/shadcn/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { ApiValidationError } from '@/lib/api'
import { requestPasswordResetLink } from '@/lib/password-reset.api'
import { mapPasswordResetMessage } from '@/lib/password.messages'

const forgotPasswordSchema = z.object({
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .min(1, 'Bitte gib deine E-Mail Adresse ein'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordPageProps {
  onBackToLogin: () => void
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [linkSent, setLinkSent] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await requestPasswordResetLink(data.email)
      setLinkSent(true)
    } catch (err) {
      if (err instanceof ApiValidationError && err.errors?.email) {
        form.setError('email', {
          message: mapPasswordResetMessage(err.errors.email[0]),
        })
        return
      }

      toast.error(
        'Der Link konnte nicht gesendet werden. Bitte versuche es erneut.'
      )
    }
  }

  return (
    <form
      id={'form-forgot-password'}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full sm:max-w-sm">
          <CardHeader>
            <CardTitle>Passwort vergessen</CardTitle>
            <CardDescription>
              {linkSent
                ? 'Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.'
                : 'Gib deine E-Mail Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.'}
            </CardDescription>
          </CardHeader>

          {!linkSent && (
            <CardContent>
              <FieldGroup>
                <Controller
                  name={'email'}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>E-Mail</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        type="email"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          )}

          <CardFooter className="flex-col gap-2">
            {!linkSent && (
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Link wird gesendet...'
                  : 'Link senden'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onBackToLogin}
            >
              Zurück zur Anmeldung
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
