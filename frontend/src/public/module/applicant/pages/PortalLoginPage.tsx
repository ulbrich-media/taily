import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MailCheck, UserRound } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Button } from '@/shadcn/components/ui/button'
import { FieldGroup } from '@/shadcn/components/ui/field'
import { TextInput } from '@/components/field/TextInput'
import { requestLoginLink } from '../api/requests'
import { ApplicantLayout } from '../components/ApplicantLayout'

const schema = z.object({ email: z.email('Bitte gib eine E-Mail-Adresse ein') })

/**
 * Applicants have no password: they get a link to the address they applied
 * with. The answer never says whether the address is known.
 */
export function PortalLoginPage({ notice }: { notice?: string }) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })
  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof schema>) => requestLoginLink(data.email),
  })

  return (
    <ApplicantLayout>
      <Card className="mx-auto w-full sm:max-w-md">
        {mutation.isSuccess ? (
          <CardHeader>
            <CardTitle variant="success">Schau in dein Postfach</CardTitle>
            <CardTitleIcon icon={MailCheck} />
            <CardDescription>{mutation.data.message}</CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Meine Bewerbungen</CardTitle>
              <CardTitleIcon icon={UserRound} />
              <CardDescription>
                {notice ??
                  'Gib die E-Mail-Adresse ein, mit der du dich beworben hast. Wir schicken dir einen Link, der 4 Stunden gültig ist.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                className="space-y-4"
              >
                <FieldGroup>
                  <TextInput
                    name="email"
                    control={form.control}
                    label="E-Mail"
                    type="email"
                    required
                  />
                </FieldGroup>
                {mutation.isError && (
                  <p className="text-sm text-destructive">
                    {mutation.error.message}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={mutation.isPending}
                >
                  Link schicken
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </ApplicantLayout>
  )
}
