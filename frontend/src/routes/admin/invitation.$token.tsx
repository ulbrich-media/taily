import { createFileRoute } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
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
} from '@/shadcn/components/ui/field'
import {
  acceptInvitation,
  type AcceptInvitationData,
  getInvitationDetails,
} from '@/lib/invitations.api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Route as LoginRoute } from '@/routes/admin/login'

const invitationSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Bitte gib deinen Namen ein')
      .max(255, 'Der Name ist zu lang'),
    password: z
      .string()
      .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein'),
    password_confirmation: z.string().min(1, 'Bitte bestätige dein Passwort'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Die Passwörter stimmen nicht überein',
    path: ['password_confirmation'],
  })

type InvitationFormData = z.infer<typeof invitationSchema>

export const Route = createFileRoute('/admin/invitation/$token')({
  component: InvitationPage,
})

function InvitationPage() {
  const { token } = Route.useParams()
  const navigate = LoginRoute.useNavigate()

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      name: '',
      password: '',
      password_confirmation: '',
    },
  })

  const {
    data: invitation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => getInvitationDetails(token),
  })

  useEffect(() => {
    if (invitation && !form.formState.isDirty) {
      form.setValue('name', invitation.name)
    }
  })

  if (isError) {
    toast.error('Einladung nicht gefunden oder abgelaufen.')
  }

  const { mutate } = useMutation({
    mutationFn: (data: AcceptInvitationData) => acceptInvitation(token, data),
    onSuccess: (response) => {
      toast.success(response.message)
      setTimeout(() => {
        navigate({})
      }, 1500)
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Fehler beim Annehmen der Einladung. Bitte versuchen Sie es erneut.'
      )
    },
  })

  const onSubmit = async (data: InvitationFormData) => {
    return mutate(data)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full sm:max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Lädt...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full sm:max-w-md">
          <CardHeader>
            <CardTitle>Einladung nicht gefunden</CardTitle>
            <CardDescription>
              Diese Einladung ist ungültig oder abgelaufen.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <form
      id="form-invitation-accept"
      onSubmit={form.handleSubmit(onSubmit)}
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <Card className="w-full sm:max-w-md">
        <CardHeader>
          <CardTitle>Einladung annehmen</CardTitle>
          <CardDescription>
            Setze deinen Namen und dein Passwort, um dein Konto zu aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>E-Mail</FieldLabel>
              <Input value={invitation.email} disabled />
            </Field>

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="text"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
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

            <Controller
              name="password_confirmation"
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
            disabled={form.formState.isSubmitting || isLoading}
          >
            {form.formState.isSubmitting
              ? 'Wird verarbeitet...'
              : 'Einladung annehmen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
