import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { usePasskeyVerify } from '@laravel/passkeys/react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shadcn/components/ui/tooltip'
import { useAuth } from '@/lib/auth.hook'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'
import { mapAuthMessage } from '@/lib/password.messages'
import { csrfCookie } from '@/lib/api'
import { PASSKEY_VERIFY_ROUTES } from '@/lib/passkeys'

const loginSchema = z.object({
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .min(1, 'Bitte gib deine E-Mail Adresse ein'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  onAlreadyAuthenticated: () => void
  onForgotPassword: () => void
  onTwoFactorRequired: () => void
}

export function LoginPage({
  onAlreadyAuthenticated,
  onForgotPassword,
  onTwoFactorRequired,
}: LoginPageProps) {
  const { login, isAuthenticated, isLoading, refreshProfile } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // A passkey verification needs a CSRF cookie before it can POST the signed
  // assertion, same as the password login below. Fetched once on mount so
  // it's already in place by the time the (much slower, biometric-gated)
  // ceremony completes — autofill starts automatically as soon as the browser
  // reports support.
  useEffect(() => {
    void csrfCookie()
  }, [])

  const {
    verify: verifyPasskey,
    isLoading: isPasskeyLoading,
    isSupported: isPasskeySupported,
  } = usePasskeyVerify({
    autofill: true,
    routes: PASSKEY_VERIFY_ROUTES,
    onSuccess: () => {
      void refreshProfile()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    onAlreadyAuthenticated()
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { twoFactorRequired } = await login(data.email, data.password)
      if (twoFactorRequired) {
        onTwoFactorRequired()
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? mapAuthMessage(err.message)
          : 'Ungültige Anmeldedaten. Bitte versuche es erneut.'
      )
    }
  }

  return (
    <form id={'form-login'} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full sm:max-w-sm">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Gib deine Anmeldedaten ein, um auf den Adoptionsmanager
              zuzugreifen.
            </CardDescription>
          </CardHeader>
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
                      // The "webauthn" token lets the browser anchor its
                      // passkey autofill dropdown to this field.
                      autoComplete="username webauthn"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name={'password'}
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Passwort</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      type="password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* The wrapping span keeps the tooltip hoverable even
                      though `disabled:pointer-events-none` blocks hover on
                      the button itself. */}
                  <span className="block w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => void verifyPasskey()}
                      disabled={!isPasskeySupported || isPasskeyLoading}
                    >
                      {isPasskeyLoading
                        ? 'Wird angemeldet...'
                        : 'Mit Passkey anmelden'}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!isPasskeySupported && (
                  <TooltipContent>
                    Dein Browser unterstützt keine Passkeys.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onForgotPassword}
            >
              Passwort vergessen?
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
