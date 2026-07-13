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
import {
  InfoRow,
  InfoRowEmptyValue,
} from '@/shadcn/components/common/info-row.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'
import { Spinner } from '@/shadcn/components/ui/spinner.tsx'
import { FilePenLineIcon } from 'lucide-react'
import { Button } from '@/shadcn/components/ui/button.tsx'
import { getTransportTitle } from '@/admin/module/transports/utils.ts'

interface AdoptionDetailPageProps {
  adoption: AdoptionDetailResource
  inspectionsData: PreInspectionResource[] | undefined
  inspectionsLoading: boolean
  inspectionsError: boolean
  editInternalNotesAction: (hasNote: boolean) => ReactNode
  editContractAction: ReactNode
  editPreInspectionAction: (hasNote: boolean) => ReactNode
  newInspectionAction: ReactNode
  cancelAction: ReactNode
  reopenAction: ReactNode
  assignTransportAction: ReactNode
  removeTransportAction: ReactNode | null
  renderInspectionDetailLink?: (inspection: PreInspectionResource) => ReactNode
}

export function AdoptionDetailPage({
  adoption,
  inspectionsData,
  inspectionsLoading,
  inspectionsError,
  editInternalNotesAction,
  editContractAction,
  editPreInspectionAction,
  newInspectionAction,
  cancelAction,
  reopenAction,
  assignTransportAction,
  removeTransportAction,
  renderInspectionDetailLink,
}: AdoptionDetailPageProps) {
  const isCanceled = adoption.status === 'canceled'
  const canCancel =
    adoption.status === 'pending' || adoption.status === 'in_progress'

  return (
    <div className="space-y-4">
      <StepCard title="Über diese Vermittlung">
        <div className="space-y-4">
          <InfoRow label="Allgemeine Notizen">{adoption.notes}</InfoRow>

          {isCanceled && (
            <>
              <InfoRow label="Abgebrochen am">
                {formatApiDate(adoption.canceled_at)}
              </InfoRow>
              <InfoRow label="Grund für den Abbruch">
                {adoption.canceled_reason}
              </InfoRow>
            </>
          )}

          <div className="flex justify-end gap-2">
            {editInternalNotesAction(!!adoption.notes)}
            {canCancel && cancelAction}
            {isCanceled && reopenAction}
          </div>
        </div>
      </StepCard>

      <StepCard
        title="Vorkontrolle"
        status={
          <BadgeBySet
            set={{
              not_started: { label: 'Offen', variant: 'outline' },
              pending: { label: 'In Bearbeitung', variant: 'info' },
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
            {editPreInspectionAction(!!adoption.pre_inspection_notes)}
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
              pending: { label: 'In Bearbeitung', variant: 'warning' },
              finished: { label: 'Abgeschlossen', variant: 'success' },
            }}
            value={adoption.contract_status}
          />
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Unterzeichnet">
              {adoption.contract_signed ? 'Ja' : 'Nein'}
            </InfoRow>
            {adoption.contract_signed_at && (
              <InfoRow label="Unterzeichnet am">
                {formatApiDate(adoption.contract_signed_at)}
              </InfoRow>
            )}
            {adoption.contract_file && (
              <InfoRow label="Schutzvertrag">
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={adoption.contract_file.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FilePenLineIcon className="size-4" />
                    {adoption.contract_file.name}
                  </a>
                </Button>
              </InfoRow>
            )}
          </div>
          <div className="flex justify-end">{editContractAction}</div>
        </div>
      </StepCard>

      <StepCard
        title="Transport"
        status={
          <BadgeBySet
            set={{
              not_started: { label: 'Nicht begonnen', variant: 'outline' },
              pending: { label: 'Transport geplant', variant: 'info' },
              finished: { label: 'Abgeschlossen', variant: 'success' },
            }}
            value={adoption.transport_status}
          />
        }
      >
        <div className="space-y-4">
          {adoption.transport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <InfoRow label="Name">
                  {getTransportTitle(adoption.transport)}
                </InfoRow>
              </div>
              <InfoRow label="Geplantes Datum">
                {adoption.transport.planned_at ? (
                  formatApiDate(adoption.transport.planned_at)
                ) : (
                  <InfoRowEmptyValue />
                )}
              </InfoRow>
              <InfoRow label="Abgeschlossen am">
                {adoption.transport.done_at ? (
                  formatApiDate(adoption.transport.done_at)
                ) : (
                  <InfoRowEmptyValue />
                )}
              </InfoRow>
              <InfoRow label="Verantwortliche Person">
                {adoption.transport.responsible ? (
                  adoption.transport.responsible.full_name
                ) : (
                  <InfoRowEmptyValue />
                )}
              </InfoRow>
              <InfoRow label="Transporteur">
                {adoption.transport.transporter ? (
                  adoption.transport.transporter
                ) : (
                  <InfoRowEmptyValue />
                )}
              </InfoRow>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Kein Transport zugewiesen.
            </p>
          )}
          <div className="flex justify-end gap-2">
            {removeTransportAction}
            {!adoption.transport?.is_done ? assignTransportAction : null}
          </div>
        </div>
      </StepCard>

      <StepCard
        title="Übergabe"
        status={
          <BadgeBySet
            set={{
              not_started: { label: 'Nicht begonnen', variant: 'outline' },
              pending: { label: 'In Bearbeitung', variant: 'info' },
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
  status?: ReactNode
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
