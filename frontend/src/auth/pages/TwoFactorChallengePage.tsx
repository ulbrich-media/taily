import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { FieldGroup } from '@/shadcn/components/ui/field'
import { FormFieldWrapper } from '@/components/form/FormFieldWrapper'
import { useAuth } from '@/lib/auth.hook'
import { toast } from 'sonner'

const codeSchema = z.object({
  code: z.string().min(1, 'Bitte gib den Code aus deiner App ein'),
})

const recoveryCodeSchema = z.object({
  recovery_code: z
    .string()
    .min(1, 'Bitte gib einen Wiederherstellungscode ein'),
})

type CodeFormData = z.infer<typeof codeSchema>
type RecoveryCodeFormData = z.infer<typeof recoveryCodeSchema>

interface TwoFactorChallengePageProps {
  onBackToLogin: () => void
}

export function TwoFactorChallengePage({
  onBackToLogin,
}: TwoFactorChallengePageProps) {
  const { completeTwoFactorChallenge } = useAuth()
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: '' },
  })

  const recoveryForm = useForm<RecoveryCodeFormData>({
    resolver: zodResolver(recoveryCodeSchema),
    defaultValues: { recovery_code: '' },
  })

  const handleInvalid = () => {
    toast.error('Der Code ist ungültig. Bitte versuche es erneut.')
  }

  const onSubmitCode = async (data: CodeFormData) => {
    try {
      await completeTwoFactorChallenge({ code: data.code })
    } catch {
      handleInvalid()
      codeForm.resetField('code')
    }
  }

  const onSubmitRecovery = async (data: RecoveryCodeFormData) => {
    try {
      await completeTwoFactorChallenge({ recovery_code: data.recovery_code })
    } catch {
      handleInvalid()
      recoveryForm.resetField('recovery_code')
    }
  }

  const toggleMode = () => {
    setUseRecoveryCode((previous) => !previous)
    codeForm.reset()
    recoveryForm.reset()
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full sm:max-w-sm">
        <CardHeader>
          <CardTitle>Bestätigung in zwei Schritten</CardTitle>
          <CardDescription>
            {useRecoveryCode
              ? 'Gib einen deiner Wiederherstellungscodes ein, um dich anzumelden.'
              : 'Gib den Code aus deiner Authentifizierungs-App ein, um dich anzumelden.'}
          </CardDescription>
        </CardHeader>

        {useRecoveryCode ? (
          <form
            key="recovery"
            id="form-two-factor-recovery"
            onSubmit={recoveryForm.handleSubmit(onSubmitRecovery)}
            noValidate
          >
            <CardContent>
              <FieldGroup>
                <FormFieldWrapper
                  name="recovery_code"
                  control={recoveryForm.control}
                  label="Wiederherstellungscode"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      autoComplete="one-time-code"
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={recoveryForm.formState.isSubmitting}
              >
                {recoveryForm.formState.isSubmitting
                  ? 'Anmelden...'
                  : 'Anmelden'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={toggleMode}
              >
                Code aus der App verwenden
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBackToLogin}
              >
                Zurück zur Anmeldung
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form
            key="code"
            id="form-two-factor-code"
            onSubmit={codeForm.handleSubmit(onSubmitCode)}
            noValidate
          >
            <CardContent>
              <FieldGroup>
                <FormFieldWrapper
                  name="code"
                  control={codeForm.control}
                  label="Code"
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  )}
                />
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col gap-2 pt-6">
              <Button
                type="submit"
                className="w-full"
                disabled={codeForm.formState.isSubmitting}
              >
                {codeForm.formState.isSubmitting ? 'Anmelden...' : 'Anmelden'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={toggleMode}
              >
                Wiederherstellungscode verwenden
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={onBackToLogin}
              >
                Zurück zur Anmeldung
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
