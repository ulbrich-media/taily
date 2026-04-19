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
  editPreInspectionAction: ReactNode
  newInspectionAction: ReactNode
  renderInspectionDetailLink?: (inspection: PreInspectionResource) => ReactNode
}

export function AdoptionDetailPage({
  adoption,
  inspectionsData,
  inspectionsLoading,
  inspectionsError,
  editPreInspectionAction,
  newInspectionAction,
  renderInspectionDetailLink,
}: AdoptionDetailPageProps) {
  return (
    <div className="space-y-4">
      <StepCard
        title="Vorkontrolle"
        status={
          adoption.pre_inspection_result && (
            <BadgeBySet
              set={{
                not_conducted: {
                  label: 'Offen',
                  variant: 'outline',
                },
                approved: {
                  label: 'Akzeptiert',
                  variant: 'success',
                },
                rejected: {
                  label: 'Abgelehnt',
                  variant: 'destructive',
                },
              }}
              value={adoption.pre_inspection_result}
            />
          )
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

          {adoption.pre_inspection_summary && (
            <InfoRow label="Zusammenfassung">
              {adoption.pre_inspection_summary}
            </InfoRow>
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
              not_started: {
                label: 'Nicht begonnen',
                variant: 'outline',
              },
              in_progress: {
                label: 'In Bearbeitung',
                variant: 'warning',
              },
              finished: {
                label: 'Abgeschlossen',
                variant: 'success',
              },
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
              not_started: {
                label: 'Nicht begonnen',
                variant: 'outline',
              },
              in_progress: {
                label: 'In Bearbeitung',
                variant: 'warning',
              },
              finished: {
                label: 'Abgeschlossen',
                variant: 'success',
              },
            }}
            value={adoption.transfer_status}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Geplant am">
            {formatApiDate(adoption.transfer_planned_at)}
          </InfoRow>
          <InfoRow label="Übergeben am">
            {formatApiDate(adoption.transferred_at)}
          </InfoRow>
        </div>
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
