import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card.tsx'
import { formatApiDate } from '@/lib/dates.utils.ts'
import type { TransportListResource } from '@/api/types/transports.ts'
import { AdoptionList } from '@/admin/module/adoptions/components/AdoptionList.tsx'
import {
  InfoRow,
  InfoRowEmptyValue,
} from '@/shadcn/components/common/info-row.tsx'
import type { AdoptionListResource } from '@/api/types/adoptions.ts'
import type { ReactNode } from 'react'

interface TransportDetailCardProps {
  transport: TransportListResource
  actions?: ReactNode
  renderAdoptionDetailLink?: (adoption: AdoptionListResource) => ReactNode
}

export function TransportDetailCard({
  transport,
  actions,
  renderAdoptionDetailLink,
}: TransportDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {transport.planned_at
            ? `Transport am ${formatApiDate(transport.planned_at)}`
            : 'Transport'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Geplantes Datum">
              {transport.planned_at ? (
                formatApiDate(transport.planned_at)
              ) : (
                <InfoRowEmptyValue />
              )}
            </InfoRow>
            <InfoRow label="Abgeschlossen am">
              {transport.done_at ? (
                formatApiDate(transport.done_at)
              ) : (
                <InfoRowEmptyValue />
              )}
            </InfoRow>
          </div>
          <InfoRow label="Notizen">{transport.notes}</InfoRow>
          <InfoRow label="Vermittlungen">
            {transport.adoptions.length > 0 ? (
              <AdoptionList
                adoptions={transport.adoptions}
                showAnimal
                showApplicant
                showMediator
                renderDetailLink={renderAdoptionDetailLink}
              />
            ) : (
              <InfoRowEmptyValue />
            )}
          </InfoRow>
        </div>
      </CardContent>
      {actions && <CardFooter className="justify-end gap-2">{actions}</CardFooter>}
    </Card>
  )
}
