import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ADOPTION_STEP_LABELS } from '@/api/types/case-file'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/shadcn/components/ui/alert'
import { Button } from '@/shadcn/components/ui/button'
import type { PortalAdoption } from '../api/types'
import { applicantQueryKeys } from '../api/queries'
import { updatePortalCaseFile } from '../api/requests'
import { ApplicantCaseFileForm } from '../components/ApplicantCaseFileForm'
import { AnimalHeading, ApplicantLayout } from '../components/ApplicantLayout'
import { StepTimeline } from '../components/StepTimeline'

interface PortalAdoptionPageProps {
  adoption: PortalAdoption
  backLink: ReactNode
}

/**
 * One adoption in the portal: where it stands, what is still missing for
 * the current step, and the applicant's data as configured — editable while
 * the adoption runs (docs/features/applicant-portal.md).
 */
export function PortalAdoptionPage({
  adoption,
  backLink,
}: PortalAdoptionPageProps) {
  const queryClient = useQueryClient()

  if (adoption.status === 'canceled' || !adoption.steps || !adoption.groups) {
    return (
      <ApplicantLayout action={backLink}>
        <AnimalHeading
          title={`Bewerbung für ${adoption.animal.name} – beendet`}
          animal={adoption.animal}
        />
      </ApplicantLayout>
    )
  }

  const current = adoption.current_step ?? 'application'
  const open = adoption.open ?? []

  return (
    <ApplicantLayout action={backLink}>
      <AnimalHeading
        title={`Bewerbung für ${adoption.animal.name}`}
        animal={adoption.animal}
      />

      <StepTimeline steps={adoption.steps} current={current} />

      {adoption.editable && open.length > 0 && (
        <Alert>
          <AlertTitle>
            Für „{ADOPTION_STEP_LABELS[current]}“ fehlen noch {open.length}{' '}
            {open.length === 1 ? 'Angabe' : 'Angaben'}
          </AlertTitle>
          <AlertDescription>
            {open.map((item) => item.label).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {!adoption.editable && (
        <p className="text-sm text-muted-foreground">
          Diese Vermittlung ist abgeschlossen. Deine Angaben kannst du hier noch
          ansehen.
        </p>
      )}

      <ApplicantCaseFileForm
        // Fresh defaults after every save.
        key={JSON.stringify(
          adoption.groups.map((g) => g.fields.map((f) => f.value))
        )}
        groups={adoption.groups}
        currentStep={current}
        readOnly={!adoption.editable}
        onSubmit={async (values) => {
          try {
            const response = await updatePortalCaseFile(adoption.id, values)
            queryClient.setQueryData(
              applicantQueryKeys.adoption(adoption.id),
              response.data
            )
            toast.success(response.message)
          } catch (error) {
            toast.error('Bitte prüfe deine Angaben.')
            throw error
          }
        }}
        footer={({ isSubmitting }) =>
          adoption.editable ? (
            <div className="sticky bottom-4 flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? 'Speichern …' : 'Angaben speichern'}
              </Button>
            </div>
          ) : null
        }
      />
    </ApplicantLayout>
  )
}
