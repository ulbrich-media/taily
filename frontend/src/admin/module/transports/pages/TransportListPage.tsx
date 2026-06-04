import type { ReactNode } from 'react'
import { SlashSquare, Truck } from 'lucide-react'
import type { TransportListResource } from '@/api/types/transports'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shadcn/components/ui/empty.tsx'
import { TransportDetailCard } from '@/admin/module/transports/components/TransportDetailCard.tsx'
import type { AdoptionListResource } from '@/api/types/adoptions.ts'

interface TransportListPageProps {
  transports: TransportListResource[]
  createAction: ReactNode
  createActionForEmpty: ReactNode
  renderActions: (t: TransportListResource) => ReactNode
  renderAdoptionDetailLink?: (adoption: AdoptionListResource) => ReactNode
}

export function TransportListPage({
  transports,
  createAction,
  createActionForEmpty,
  renderActions,
  renderAdoptionDetailLink,
}: TransportListPageProps) {
  const hasData = transports && transports.length > 0

  const { plannedTransports, doneTransports } = transports.reduce<{
    plannedTransports: TransportListResource[]
    doneTransports: TransportListResource[]
  }>(
    (map, transport) => {
      return {
        doneTransports: [
          ...map.doneTransports,
          ...(transport.is_done ? [transport] : []),
        ],
        plannedTransports: [
          ...map.plannedTransports,
          ...(!transport.is_done ? [transport] : []),
        ],
      }
    },
    { plannedTransports: [], doneTransports: [] }
  )

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Truck}
        title="Transporte"
        description="Plane die nächsten Tiertransporte"
        actions={createAction}
      />

      {!hasData && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SlashSquare />
            </EmptyMedia>
            <EmptyTitle>Keine Transporte gefunden</EmptyTitle>
            <EmptyDescription>Noch keine Transporte angelegt.</EmptyDescription>
            <EmptyContent>{createActionForEmpty}</EmptyContent>
          </EmptyHeader>
        </Empty>
      )}

      {hasData && (
        <>
          <div className="space-y-4">
            <SectionHeader title="Geplante Transporte" />

            {plannedTransports.length === 0 && (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Keine Transporte geplant</EmptyTitle>
                  <EmptyDescription>
                    Plane jetzt deinen nächsten Transport!
                  </EmptyDescription>
                  <EmptyContent>{createActionForEmpty}</EmptyContent>
                </EmptyHeader>
              </Empty>
            )}

            {plannedTransports.map((transport) => (
              <TransportDetailCard
                key={transport.id}
                transport={transport}
                actions={renderActions(transport)}
                renderAdoptionDetailLink={renderAdoptionDetailLink}
              />
            ))}
          </div>

          {doneTransports.length > 0 && (
            <div className="space-y-4">
              <SectionHeader title="Abgeschlossene Transporte" />

              {doneTransports.map((transport) => (
                <TransportDetailCard
                  key={transport.id}
                  transport={transport}
                  actions={renderActions(transport)}
                  renderAdoptionDetailLink={renderAdoptionDetailLink}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xl font-bold text-foreground">{title}</h2>
}
