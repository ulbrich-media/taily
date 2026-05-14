import type { ReactNode } from 'react'
import type { AdoptionDetailResource } from '@/api/types/adoptions'
import type { PreInspectionResource } from '@/api/types/pre-inspections'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { PreInspectionList } from '@/admin/module/pre-inspections/components/PreInspectionList'
import { BadgeBySet } from '@/shadcn/components/ui/badge-utils.tsx'
import { InfoRow } from '@/shadcn/components/common/info-row.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'
import { Spinner } from '@/shadcn/components/ui/spinner.tsx'

interface AdoptionDetailPageProps {
  adoption: AdoptionDetailResource
  inspectionsData: PreInspectionResource[] | undefined
  inspectionsLoading: boolean
  inspectionsError: boolean
  editInternalNotesAction: ReactNode
  editPreInspectionAction: ReactNode
  newInspectionAction: ReactNode
  renderInspectionDetailLink?: (inspection: PreInspectionResource) => ReactNode
}

export function AdoptionDetailPage({
  adoption,
  inspectionsData,
  inspectionsLoading,
  inspectionsError,
  editInternalNotesAction,
  editPreInspectionAction,
  newInspectionAction,
  renderInspectionDetailLink,
}: AdoptionDetailPageProps) {
  return (
    <div className="space-y-4">
      {/* Internal notes – always visible above process steps */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle>Interne Notizen</CardTitle>
            {editInternalNotesAction}
          </div>
        </CardHeader>
        <CardContent>
          {adoption.internal_notes ? (
            <p className="text-sm whitespace-pre-wrap">{adoption.internal_notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Notizen vorhanden.</p>
          )}
        </CardContent>
      </Card>

      <StepCard
        title="Vorkontrolle"
        status={
          <BadgeBySet
            set={{
              pending: { label: 'Offen', variant: 'outline' },
              not_started: { label: 'Offen', variant: 'outline' },
              in_progress: { label: 'In Bearbeitung', variant: 'warning' },
              finished: { label: 'Abgeschlossen', variant: 'success' },
            }}
            value={adoption.pre_inspection_status}
          />
        }
      >
        <div className="space-y-4">
          <InfoRow label="Verfügbare Vorkontrollen">
            {inspectionsLoading ? (
              <p className="text-sm text-muted-foreground flex gap-2 items-baseline">
                <Spinner className="size-3" />
                Lade Vorkontrollen...
              </p>
            ) : inspectionsError ? (
              <p className="text-sm text-destructive">
                Fehler beim Laden der Vorkontrollen.
              </p>
            ) : !inspectionsData?.length ? null : (
              <PreInspectionList
                inspections={inspectionsData}
                renderDetailLink={renderInspectionDetailLink}
              />
            )}
          </InfoRow>

          {adoption.pre_inspection_notes && (
            <InfoRow label="Notizen">{adoption.pre_inspection_notes}</InfoRow>
          )}

          <div className="flex justify-end gap-2">
            {editPreInspectionAction}
            {newInspectionAction}
          </div>
        </div>
      </StepCard>

      <StepCard
        title="Vertrag"
        status={
          <BadgeBySet
            set={{
              not_started: { label: 'Nicht begonnen', variant: 'outline' },
              pending: { label: 'Nicht begonnen', variant: 'outline' },
              in_progress: { label: 'In Bearbeitung', variant: 'warning' },
              finished: { label: 'Abgeschlossen', variant: 'success' },
            }}
            value={adoption.contract_status}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Versendet am">
            {formatApiDate(adoption.contract_sent_at)}
          </InfoRow>
          <InfoRow label="Unterzeichnet">
            {adoption.contract_signed ? 'Ja' : 'Nein'}
          </InfoRow>
        </div>
      </StepCard>

      <StepCard
        title="Übergabe"
        status={
          <BadgeBySet
            set={{
              not_started: { label: 'Nicht begonnen', variant: 'outline' },
              pending: { label: 'Nicht begonnen', variant: 'outline' },
              in_progress: { label: 'In Bearbeitung', variant: 'warning' },
              finished: { label: 'Abgeschlossen', variant: 'success' },
            }}
            value={adoption.handover_status}
          />
        }
      >
        <InfoRow label="Übergeben am">
          {formatApiDate(adoption.handed_over_at)}
        </InfoRow>
      </StepCard>
    </div>
  )
}

function StepCard({
  title,
  status,
  children,
}: {
  title: string
  status: ReactNode
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <CardTitle>{title}</CardTitle>
            {status}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
