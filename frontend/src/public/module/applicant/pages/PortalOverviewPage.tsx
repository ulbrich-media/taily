import type { ReactNode } from 'react'
import { ADOPTION_STEP_LABELS } from '@/api/types/case-file'
import { Card, CardContent } from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { formatApiDate } from '@/lib/dates.utils'
import type { PortalOverview } from '../api/types'
import { ApplicantLayout } from '../components/ApplicantLayout'

const PORTAL_STATUS_LABELS = {
  unconfirmed: 'Nicht bestätigt',
  pending: 'Eingegangen',
  in_progress: 'In Bearbeitung',
  done: 'Abgeschlossen',
  canceled: 'Beendet',
} as const

interface PortalOverviewPageProps {
  overview: PortalOverview
  logoutAction: ReactNode
  renderOpenLink: (adoptionId: string, children: ReactNode) => ReactNode
}

/** Every adoption with the applicant's email. */
export function PortalOverviewPage({
  overview,
  logoutAction,
  renderOpenLink,
}: PortalOverviewPageProps) {
  return (
    <ApplicantLayout action={logoutAction}>
      <div className="space-y-1">
        <h1 className="font-heading text-3xl">Meine Bewerbungen</h1>
        <p className="text-sm text-muted-foreground">{overview.email}</p>
      </div>

      {overview.adoptions.length === 0 && (
        <p className="text-muted-foreground">Keine Bewerbungen gefunden.</p>
      )}

      {overview.adoptions.map((adoption) => (
        <Card key={adoption.id}>
          <CardContent className="flex items-center gap-4">
            {adoption.animal.picture_url && (
              <img
                src={adoption.animal.picture_url}
                alt={adoption.animal.name}
                className="size-16 shrink-0 rounded-md object-cover"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="font-medium">
                {adoption.status === 'canceled'
                  ? `Bewerbung für ${adoption.animal.name} – beendet`
                  : `Bewerbung für ${adoption.animal.name}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {adoption.animal.animal_type} · seit{' '}
                {formatApiDate(adoption.created_at)}
                {adoption.current_step &&
                  adoption.status !== 'done' &&
                  ` · aktuell: ${ADOPTION_STEP_LABELS[adoption.current_step]}`}
              </p>
              <Badge variant="outline">
                {PORTAL_STATUS_LABELS[adoption.status]}
              </Badge>
            </div>
            {adoption.status !== 'canceled' &&
              renderOpenLink(adoption.id, 'Öffnen')}
          </CardContent>
        </Card>
      ))}
    </ApplicantLayout>
  )
}
