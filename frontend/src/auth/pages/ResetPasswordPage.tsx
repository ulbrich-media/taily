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
import { resetPassword } from '@/lib/password-reset.api'
import { passwordConfirmationSchema } from '@/lib/password.schema'
import {
  mapPasswordResetMessage,
  mapPasswordValidationMessage,
} from '@/lib/password.messages'

const resetPasswordSchema = passwordConfirmationSchema

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordPageProps {
  token?: string
  email?: string
  onSuccess: () => void
  onRequestNewLink: () => void
}

export function ResetPasswordPage({
  token,
  email,
  onSuccess,
  onRequestNewLink,
}: ResetPasswordPageProps) {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  })

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full sm:max-w-sm">
          <CardHeader>
            <CardTitle>Ungültiger Link</CardTitle>
            <CardDescription>
              Der Link zum Zurücksetzen des Passworts ist unvollständig. Bitte
              fordere einen neuen Link an.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button type="button" className="w-full" onClick={onRequestNewLink}>
              Neuen Link anfordern
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      })

      toast.success(
        'Passwort erfolgreich geändert. Du kannst dich jetzt anmelden.'
      )
      onSuccess()
    } catch (err) {
      if (err instanceof ApiValidationError && err.errors) {
        // The broker reports an invalid/expired token (or unknown user) on
        // the email field.
        if (err.errors.email) {
          toast.error(mapPasswordResetMessage(err.errors.email[0]))
          return
        }
        if (err.errors.password) {
          form.setError('password', {
            message: mapPasswordValidationMessage(err.errors.password[0]),
          })
          return
        }
      }

      toast.error(
        'Das Passwort konnte nicht geändert werden. Bitte versuche es erneut.'
      )
    }
  }

  return (
    <form
      id={'form-reset-password'}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
    >
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full sm:max-w-sm">
          <CardHeader>
            <CardTitle>Neues Passwort festlegen</CardTitle>
            <CardDescription>
              Lege ein neues Passwort für dein Konto ({email}) fest.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Controller
                name={'password'}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Neues Passwort</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      type="password"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={'password_confirmation'}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Passwort bestätigen
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      type="password"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>

          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? 'Passwort wird gespeichert...'
                : 'Passwort speichern'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
