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
import { useAuth } from '@/lib/auth.hook'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shadcn/components/ui/field.tsx'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z
    .email('Bitte gib eine gültige E-Mail Adresse ein')
    .min(1, 'Bitte gib deine E-Mail Adresse ein'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginPageProps {
  onAlreadyAuthenticated: () => void
}

export function LoginPage({ onAlreadyAuthenticated }: LoginPageProps) {
  const { login, isAuthenticated, isLoading } = useAuth()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    onAlreadyAuthenticated()
    return null
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Ungültige Anmeldedaten. Bitte versuchen es erneut.'
      )
    }
  }

  return (
    <form id={'form-login'} onSubmit={form.handleSubmit(onSubmit)}>
      <div className="min-h-screen flex items-center justify-center bg-background">
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

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Anmelden...' : 'Anmelden'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  )
}
