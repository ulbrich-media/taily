import type { ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shadcn/components/ui/card'
import { Badge } from '@/shadcn/components/ui/badge'
import { formatApiDateTime } from '@/lib/dates.utils'
import type {
  ExportAttentionItem,
  TiervermittlungExportStatus,
} from '@/admin/module/export-settings/api/types'

const LISTING_LABELS: {
  key: keyof TiervermittlungExportStatus['listings']
  label: string
}[] = [
  { key: 'veroeffentlicht', label: 'Veröffentlicht' },
  { key: 'nicht_veroeffentlicht', label: 'Nicht veröffentlicht' },
  { key: 'doppelt', label: 'Doppelt' },
  { key: 'abgelehnt', label: 'Abgelehnt' },
  { key: 'not_delivered', label: 'Noch nicht übermittelt' },
]

const ATTENTION_LABELS: Record<ExportAttentionItem['status'], string> = {
  abgelehnt: 'Abgelehnt',
  nicht_veroeffentlicht: 'Nicht veröffentlicht',
}

interface ExportStatusCardProps {
  status: TiervermittlungExportStatus
  /** Renders the link to an animal's status tab. */
  renderAnimalLink: (item: ExportAttentionItem) => ReactNode
}

export function ExportStatusCard({
  status,
  renderAnimalLink,
}: ExportStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
        <CardDescription>
          Der aktuelle Stand des Exports zu Tiervermittlung.de.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={status.enabled ? 'success' : 'outline'}>
            {status.enabled ? 'Export aktiviert' : 'Export deaktiviert'}
          </Badge>
          <Badge variant={status.api_key_configured ? 'success' : 'warning'}>
            {status.api_key_configured
              ? 'API-Schlüssel hinterlegt'
              : 'Kein API-Schlüssel hinterlegt'}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:max-w-sm">
          {LISTING_LABELS.map(({ key, label }) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{status.listings[key]}</dd>
            </div>
          ))}
        </dl>

        <p className="text-sm text-muted-foreground">
          Letzte erfolgreiche Übermittlung:{' '}
          {status.last_delivery_at
            ? formatApiDateTime(status.last_delivery_at)
            : 'noch keine'}
        </p>

        {status.attention.length > 0 && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Tiere mit Handlungsbedarf</p>
            <ul className="space-y-1 text-sm">
              {status.attention.map((item) => (
                <li key={item.animal_id} className="flex items-center gap-2">
                  {renderAnimalLink(item)}
                  <span className="text-muted-foreground">
                    {ATTENTION_LABELS[item.status]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
