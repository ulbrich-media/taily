import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { MailCheck, PawPrint } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardTitleIcon,
} from '@/shadcn/components/ui/card'
import { Alert, AlertDescription } from '@/shadcn/components/ui/alert'
import { Button } from '@/shadcn/components/ui/button'
import { getApplicationFormQuery } from '../api/queries'
import { submitApplication } from '../api/requests'
import { ApplicantCaseFileForm } from '../components/ApplicantCaseFileForm'
import { AnimalHeading, ApplicantLayout } from '../components/ApplicantLayout'

/**
 * The public application for one animal, reached through the link copied
 * from the animal's admin page. Asks what the organization configured for
 * the application step; the rest is asked later in the portal.
 */
export function ApplicationPage({ animalId }: { animalId: string }) {
  const { data: form } = useSuspenseQuery(getApplicationFormQuery(animalId))
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (sent) {
    return (
      <ApplicantLayout>
        <Card>
          <CardHeader>
            <CardTitle variant="success">Fast geschafft!</CardTitle>
            <CardTitleIcon icon={MailCheck} />
            <CardDescription>{sent}</CardDescription>
          </CardHeader>
        </Card>
      </ApplicantLayout>
    )
  }

  if (!form.accepts_applications) {
    return (
      <ApplicantLayout>
        <Card>
          <CardHeader>
            <CardTitle>Keine Bewerbung möglich</CardTitle>
            <CardTitleIcon icon={PawPrint} />
            <CardDescription>
              Für {form.animal.name} nehmen wir zurzeit keine Bewerbungen an.
            </CardDescription>
          </CardHeader>
        </Card>
      </ApplicantLayout>
    )
  }

  return (
    <ApplicantLayout>
      <AnimalHeading
        title={`Bewerbung für ${form.animal.name}`}
        animal={form.animal}
      >
        {form.animal.is_reserved && (
          <p className="text-sm text-muted-foreground">
            {form.animal.name} ist bereits reserviert – du kannst dich trotzdem
            bewerben.
          </p>
        )}
      </AnimalHeading>
      <p className="text-muted-foreground">
        Erzähl uns von dir. Weitere Angaben fragen wir erst, wenn sie gebraucht
        werden. Nach dem Absenden bekommst du eine E-Mail, mit der du deine
        Bewerbung bestätigst.
      </p>

      <ApplicantCaseFileForm
        groups={form.groups}
        currentStep="application"
        onSubmit={async (values) => {
          setError(null)
          try {
            const response = await submitApplication(animalId, values)
            setSent(response.message)
          } catch (exception) {
            setError(
              'Bitte prüfe deine Angaben – bei einigen Feldern fehlt noch etwas.'
            )
            throw exception
          }
        }}
        footer={({ isSubmitting }) => (
          <div className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Wird gesendet …' : 'Bewerbung absenden'}
              </Button>
            </div>
          </div>
        )}
      />
    </ApplicantLayout>
  )
}
